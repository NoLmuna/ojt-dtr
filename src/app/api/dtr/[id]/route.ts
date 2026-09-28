import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateHours } from "@/lib/utils";
import {
  cleanUndefined,
  cuidParamSchema,
  dtrEntriesUpdateSchema,
  dtrStatusUpdateSchema,
  jsonError,
  jsonResponse,
  readValidatedJson,
  validateEntriesForRecord,
} from "@/lib/security";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const parsedParams = cuidParamSchema.safeParse(await params);
  if (!parsedParams.success) {
    return jsonError("Invalid record identifier.", 400);
  }

  const { id } = parsedParams.data;
  
  // Allow access for the record owner OR their supervisor / an admin
  const record = await prisma.dTRRecord.findFirst({
    where: { id },
    include: { entries: { orderBy: { day: "asc" } }, user: { include: { supervisor: true } } },
  });

  if (!record) {
    return jsonError("Not found", 404);
  }

  const isOwner = record.userId === session.user.id;
  const isSupervisor = record.user.supervisorId === session.user.id && session.user.role === "SUPERVISOR";
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isSupervisor && !isAdmin) {
    return jsonError("Forbidden", 403);
  }

  const responseData = {
    ...record,
    user: {
      ...record.user,
      supervisor: record.user.supervisor?.name || record.user.supervisor?.email || null,
    },
  };

  return jsonResponse(responseData);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const parsedParams = cuidParamSchema.safeParse(await params);
  if (!parsedParams.success) {
    return jsonError("Invalid record identifier.", 400);
  }

  const { id } = parsedParams.data;
  const record = await prisma.dTRRecord.findFirst({
    where: { id },
    include: { user: true },
  });

  if (!record) {
    return jsonError("Not found", 404);
  }

  const isOwner = record.userId === session.user.id;
  const isSupervisor = record.user.supervisorId === session.user.id && session.user.role === "SUPERVISOR";
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isSupervisor && !isAdmin) {
    return jsonError("Forbidden", 403);
  }

  const parsed = await readValidatedJson(req, z.any());
  if (!parsed.success) return parsed.response;
  const requestBody = parsed.data;

  const entryUpdate = dtrEntriesUpdateSchema.safeParse(requestBody);
  if (entryUpdate.success) {
    const validationError = validateEntriesForRecord(entryUpdate.data.entries, record.month, record.year);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const currentEntries = await prisma.dTREntry.findMany({
      where: { dtrRecordId: id },
    });

    const upserts = entryUpdate.data.entries.map((entry) => {
      const existing = currentEntries.find(e => e.day === entry.day);

      // Security: Determine what values to save based on role
      let amArrival = entry.amArrival ?? null;
      let amDeparture = entry.amDeparture ?? null;
      let pmArrival = entry.pmArrival ?? null;
      let pmDeparture = entry.pmDeparture ?? null;
      let includeBreak = entry.includeBreak ?? true;
      let remarks = entry.remarks ?? null;
      let hoursWorked = 0;

      if (!isOwner) {
        // If supervisor/admin, they CANNOT edit time. Revert to existing or null.
        amArrival = existing?.amArrival ?? null;
        amDeparture = existing?.amDeparture ?? null;
        pmArrival = existing?.pmArrival ?? null;
        pmDeparture = existing?.pmDeparture ?? null;
        includeBreak = existing?.includeBreak ?? true;
        // They CAN edit remarks, so we keep `remarks` as provided in request.
        hoursWorked = existing?.hoursWorked ?? 0; // Use existing hours
      } else {
        // If owner, they CAN edit time, but CANNOT edit remarks. 
        remarks = existing?.remarks ?? null;
        hoursWorked = calculateHours(
          amArrival,
          amDeparture,
          pmArrival,
          pmDeparture,
          includeBreak
        );
      }

      return prisma.dTREntry.upsert({
        where: { dtrRecordId_day: { dtrRecordId: id, day: entry.day } },
        update: {
          amArrival,
          amDeparture,
          pmArrival,
          pmDeparture,
          hoursWorked,
          remarks,
          includeBreak,
        },
        create: {
          dtrRecordId: id,
          day: entry.day,
          amArrival,
          amDeparture,
          pmArrival,
          pmDeparture,
          hoursWorked,
          remarks,
          includeBreak,
        },
      });
    });

    await prisma.$transaction(upserts);

    const totals = await prisma.dTREntry.aggregate({
      where: { dtrRecordId: id },
      _sum: { hoursWorked: true },
    });
    await prisma.dTRRecord.update({
      where: { id },
      data: { totalHours: Math.round((totals._sum.hoursWorked ?? 0) * 100) / 100 },
    });

    return jsonResponse({ success: true, updated: entryUpdate.data.entries.length });
  }

  const statusUpdate = dtrStatusUpdateSchema.safeParse(requestBody);
  if (!statusUpdate.success) {
    return jsonError("Invalid request data.", 400);
  }

  // Only the owner can change the draft/submitted status
  if (!isOwner) {
    return jsonError("Forbidden", 403);
  }

  const updated = await prisma.dTRRecord.update({
    where: { id },
    data: cleanUndefined({ status: statusUpdate.data.status }),
  });

  return jsonResponse(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const parsedParams = cuidParamSchema.safeParse(await params);
  if (!parsedParams.success) {
    return jsonError("Invalid record identifier.", 400);
  }

  const { id } = parsedParams.data;
  const record = await prisma.dTRRecord.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!record) {
    return jsonError("Not found", 404);
  }

  await prisma.dTRRecord.delete({ where: { id } });
  return jsonResponse({ success: true });
}
