import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { studies } from "@/db/schema/studies";
import { eq } from "drizzle-orm";

// DELETE /api/user/delete - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, delete all user's studies (which will cascade delete related data)
    await db
      .delete(studies)
      .where(eq(studies.createdBy, session.user.id));

    // Then delete the user account
    await db
      .delete(user)
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
