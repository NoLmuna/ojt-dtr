import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistance, calculateHours } from "@/lib/utils";
import { jsonError, jsonResponse, punchSchema, readValidatedJson } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = await readValidatedJson(req, punchSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const { action, localDate, latitude, longitude } = parsed.data;

    // Server-side geolocation validation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyLat: true, companyLng: true },
    });

    if (user?.companyLat != null && user?.companyLng != null) {
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return jsonResponse(
          { error: "Location required. Please allow location access to punch." },
          { status: 400 }
        );
      }
      const distance = haversineDistance(latitude, longitude, user.companyLat, user.companyLng);
      if (distance > 100) {
        return jsonResponse(
          { error: `You are ${Math.round(distance)}m away from your company. You must be within 100m to punch.` },
          { status: 403 }
        );
      }
    }

    // Convert UTC to Philippine Standard Time (UTC+8) before extracting date components.
    // Vercel runs in UTC, so using local Date methods would give wrong hours/day for Manila users.
    const PHT_OFFSET = 8 * 60 * 60 * 1000;
    const phTime = new Date(new Date(localDate).getTime() + PHT_OFFSET);
    const year = phTime.getUTCFullYear();
    const month = phTime.getUTCMonth() + 1;
    const day = phTime.getUTCDate();
    const hours = phTime.getUTCHours();
    const minutes = phTime.getUTCMinutes();

    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    const result = await prisma.$transaction(async (tx) => {
      const periodFrom = new Date(Date.UTC(year, month - 1, 1) - PHT_OFFSET);
      const periodTo = new Date(Date.UTC(year, month, 0) - PHT_OFFSET);

      const record = await tx.dTRRecord.upsert({
        where: { userId_month_year: { userId: session.user.id, month, year } },
        update: {},
        create: {
          userId: session.user.id,
          month,
          year,
          periodFrom,
          periodTo,
        },
      });

      const entry = await tx.dTREntry.upsert({
        where: { dtrRecordId_day: { dtrRecordId: record.id, day } },
        update: {},
        create: {
          dtrRecordId: record.id,
          day,
        },
      });

      const targetField = action === "timeIn"
        ? hours < 12
          ? "amArrival"
          : "pmArrival"
        : hours < 12
          ? "amDeparture"
          : "pmDeparture";

      const updateResult = await tx.dTREntry.updateMany({
        where: { id: entry.id, [targetField]: null },
        data: { [targetField]: timeString },
      });

      if (updateResult.count === 0) {
        return { duplicate: true as const };
      }

      const refreshedEntry = await tx.dTREntry.findUnique({
        where: { id: entry.id },
      });

      if (!refreshedEntry) {
        throw new Error("Punch entry disappeared during update.");
      }

      const hoursWorked = calculateHours(
        refreshedEntry.amArrival,
        refreshedEntry.amDeparture,
        refreshedEntry.pmArrival,
        refreshedEntry.pmDeparture,
        refreshedEntry.includeBreak
      );

      const updatedEntry = await tx.dTREntry.update({
        where: { id: entry.id },
        data: { hoursWorked },
      });

      const totals = await tx.dTREntry.aggregate({
        where: { dtrRecordId: record.id },
        _sum: { hoursWorked: true },
      });

      await tx.dTRRecord.update({
        where: { id: record.id },
        data: { totalHours: Math.round((totals._sum.hoursWorked ?? 0) * 100) / 100 },
      });

      return { duplicate: false as const, targetField, updatedEntry };
    });

    if (result.duplicate) {
      return jsonResponse(
        { error: "Time entry already recorded for this period." },
        { status: 400 }
      );
    }

    return jsonResponse(
      {
        success: true,
        updated: { [result.targetField]: timeString },
        entry: result.updatedEntry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return jsonError("Internal server error", 500);
  }
}
