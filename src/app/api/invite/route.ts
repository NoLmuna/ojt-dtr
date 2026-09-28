import { NextResponse } from "next/server";
import { jsonResponse, readValidatedJson } from "@/lib/security";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendSupervisorInvitationEmail } from "@/lib/mail";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    // req is Request, but readValidatedJson takes NextRequest, though structurally they are very similar here.
    // wait, NextRequest extends Request and adds things like nextUrl, page, etc. Since we just use req.json(), we can typecast.
    const parsed = await readValidatedJson(req as any, z.object({ supervisorEmail: z.string().email() }));
    if (!parsed.success) return parsed.response;

    const { supervisorEmail } = parsed.data;

    if (!supervisorEmail || typeof supervisorEmail !== "string") {
      return jsonResponse({ error: "Invalid email" }, { status: 400 });
    }

    const traineeId = session.user.id;
    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
    });

    if (!trainee) {
      return jsonResponse({ error: "Trainee not found" }, { status: 404 });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check if an active invitation already exists
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        traineeId,
        supervisorEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    let invitation;

    if (existingInvite) {
      // Re-use token and update expiration
      invitation = await prisma.invitation.update({
        where: { id: existingInvite.id },
        data: { expiresAt },
      });
    } else {
      // Create new
      invitation = await prisma.invitation.create({
        data: {
          traineeId,
          supervisorEmail,
          token,
          expiresAt,
        },
      });
    }

    // Build the acceptance link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || req.headers.get("origin") || "http://localhost:3000";
    const acceptLink = `${baseUrl}/invite/accept?token=${invitation.token}`;

    // For local development, log the link to the console
    if (process.env.NODE_ENV === 'development') {
      console.log('----------------------------------------');
      console.log('INVITATION LINK GENERATED:');
      console.log(acceptLink);
      console.log('----------------------------------------');
    }

    // Send the email
    const mailResult = await sendSupervisorInvitationEmail(
      supervisorEmail,
      trainee.name || "A trainee",
      acceptLink
    );

    if (!mailResult.success) {
      // Optionally you could delete the invite if it failed, or return an error but keep the invite.
      console.warn("Mail failed but invite generated", mailResult.error);
    }

    return jsonResponse({ success: true, invitation }, { status: 200 });

  } catch (error) {
    console.error("Invite error:", error);
    return jsonResponse({ error: "Internal Server Error" }, { status: 500 });
  }
}