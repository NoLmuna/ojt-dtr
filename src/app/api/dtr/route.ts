import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dtrCreateSchema, jsonError, jsonResponse, readValidatedJson } from "@/lib/security";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const records = await prisma.dTRRecord.findMany({
    where: { userId: session.user.id },
    include: { entries: { orderBy: { day: "asc" } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return jsonResponse(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = await readValidatedJson(req, dtrCreateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { month, year } = parsed.data;

  const periodFrom = new Date(Date.UTC(year, month - 1, 1));
  const periodTo = new Date(Date.UTC(year, month, 0));

  const existing = await prisma.dTRRecord.findUnique({
    where: { userId_month_year: { userId: session.user.id, month, year } },
  });

  if (existing) {
    return jsonResponse(
      { error: "A DTR record for this month already exists." },
      { status: 400 }
    );
  }

  const record = await prisma.dTRRecord.create({
    data: {
      userId: session.user.id,
      month,
      year,
      periodFrom,
      periodTo,
    },
    include: { entries: true },
  });

  return jsonResponse(record, { status: 201 });
}
