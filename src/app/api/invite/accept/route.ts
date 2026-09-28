import { NextResponse } from "next/server";
import { jsonResponse, readValidatedJson } from "@/lib/security";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await auth();
    // They must be logged in to accept, so we can link them
    if (!session || !session.user?.email) {
      return jsonResponse({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const parsed = await readValidatedJson(req as any, z.object({ token: z.string() }));
    if (!parsed.success) return parsed.response;

    const { token } = parsed.data;

    if (!token) {
      return jsonResponse({ error: "No token provided" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return jsonResponse({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return jsonResponse({ error: "Invitation expired or already used" }, { status: 400 });
    }

    // Ensure the mapped emails match
    if (invitation.supervisorEmail !== session.user.email) {
      return jsonResponse({ error: "Email mismatch. Please log in with the invited email address." }, { status: 403 });
    }

    // Set accepting user as SUPERVISOR and link trainee
    // Use a transaction to ensure both updates happen together
    await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: "SUPERVISOR" },
      }),
      prisma.user.update({
        where: { id: invitation.traineeId },
        data: { supervisorId: session.user.id },
      }),
    ]);

    return jsonResponse({ success: true, message: "Invitation accepted successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Accept invite error:", error);
    return jsonResponse({ error: "Internal Server Error" }, { status: 500 });
  }
}