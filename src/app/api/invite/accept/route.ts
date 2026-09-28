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

    const parsed = await readValidatedJson(req, z.object({ token: z.string() }));
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

    if (invitation.status === "ACCEPTED") {
      return jsonResponse({ success: true, message: "Invitation has already been accepted." }, { status: 200 });
    }

    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return jsonResponse({ error: "Invitation expired or is no longer valid." }, { status: 400 });
    }

    // Ensure the mapped emails match (case-insensitive)
    const sessionEmail = session.user.email.trim().toLowerCase();
    const invitedEmail = invitation.supervisorEmail.trim().toLowerCase();

    if (invitedEmail !== sessionEmail) {
      return jsonResponse({
        error: `Email mismatch. This invitation was sent to "${invitation.supervisorEmail}", but you are signed in as "${session.user.email}". Please switch to the correct Google account.`,
      }, { status: 403 });
    }

    // Trainee cannot accept their own invite to become their own supervisor
    if (invitation.traineeId === session.user.id) {
      return jsonResponse({ error: "You cannot accept your own supervisor invitation." }, { status: 400 });
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