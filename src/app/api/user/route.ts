import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  cleanUndefined,
  jsonError,
  jsonResponse,
  readValidatedJson,
  userUpdateSchema,
} from "@/lib/security";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = await readValidatedJson(req, userUpdateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const {
    course,
    school,
    company,
    companyLat,
    companyLng,
    supervisorId,
    targetHours,
    name,
    allowWeekends,
    workStartTime,
    workEndTime,
  } = parsed.data;

  const hasLatitude = companyLat !== undefined;
  const hasLongitude = companyLng !== undefined;
  if (hasLatitude !== hasLongitude) {
    return jsonError("Company latitude and longitude must be provided together.", 400);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: cleanUndefined({
      course,
      school,
      company,
      companyLat,
      companyLng,
      targetHours,
      supervisorId,
      name,
      allowWeekends,
      workStartTime,
      workEndTime,
    }),
  });

  return jsonResponse(user);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      course: true,
      school: true,
      company: true,
      companyLat: true,
      companyLng: true,
      targetHours: true,
      allowWeekends: true,
      workStartTime: true,
      workEndTime: true,
      supervisorId: true,
      role: true,
      supervisor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return jsonResponse(user);
}
