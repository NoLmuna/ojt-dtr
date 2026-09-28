import { NextResponse } from "next/server";
import { jsonResponse } from "@/lib/security";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    // They must be logged in to access
    if (!session || !session.user?.id) {
      return jsonResponse({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check role, though anyone linking as supervisor is fine too
    const userinfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (userinfo?.role !== "SUPERVISOR" && userinfo?.role !== "ADMIN") {
      return jsonResponse({ error: "Forbidden: Not a supervisor" }, { status: 403 });
    }

    const trainees = await prisma.user.findMany({
      where: { supervisorId: userId },
      include: {
        dtrRecords: {
          orderBy: { createdAt: "desc" },
          take: 5, // Show recent records as a preview
        }
      }
    });

    return jsonResponse({ success: true, trainees }, { status: 200 });

  } catch (error) {
    console.error("Fetch trainees error:", error);
    return jsonResponse({ error: "Internal Server Error" }, { status: 500 });
  }
}