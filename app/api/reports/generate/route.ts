import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studyReports, studies } from "@/db/schema/studies";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, studyId, parameters = {} } = body;

    if (!type || !studyId) {
      return NextResponse.json(
        { error: "Missing required fields: type, studyId" },
        { status: 400 }
      );
    }

    // Verify the study belongs to the user
    const study = await db
      .select()
      .from(studies)
      .where(and(
        eq(studies.id, studyId),
        eq(studies.createdBy, session.user.id)
      ))
      .limit(1);

    if (study.length === 0) {
      return NextResponse.json(
        { error: "Study not found or access denied" },
        { status: 404 }
      );
    }

    // Generate report title based on type
    const reportTitles = {
      "loss-summary": "Loss Summary Report",
      "oee-analysis": "OEE Analysis Report", 
      "cycle-time": "Cycle Time Report",
      "production-summary": "Production Summary Report"
    };

    const reportTitle = reportTitles[type as keyof typeof reportTitles] || `${type} Report`;
    const fileName = `${reportTitle} - ${study[0].name} - ${new Date().toISOString().split('T')[0]}.pdf`;

    // Create the report record
    const reportData = {
      studyId,
      reportType: type as any,
      fileName: fileName,
      filePath: `/reports/${studyId}/${Date.now()}.pdf`, // Mock path
      format: "pdf" as const,
      parameters: JSON.stringify({
        ...parameters,
        generatedAt: new Date().toISOString(),
        studyName: study[0].name
      }),
      generatedBy: session.user.id,
      createdAt: new Date(),
    };

    await db
      .insert(studyReports)
      .values(reportData);

    return NextResponse.json({ 
      success: true, 
      message: "Report generated successfully",
      fileName: fileName,
      type: type
    }, { status: 201 });

  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
