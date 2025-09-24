import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studyReports, studies } from "@/db/schema/studies";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studyId = searchParams.get("studyId");
    const type = searchParams.get("type");

    // Build query conditions
    const conditions = [eq(studyReports.generatedBy, session.user.id)];
    
    if (studyId && studyId !== "all") {
      conditions.push(eq(studyReports.studyId, studyId));
    }
    
    if (type && type !== "all") {
      conditions.push(eq(studyReports.reportType, type as any));
    }

    // Fetch reports with study information
    const reports = await db
      .select({
        id: studyReports.id,
        title: studyReports.fileName,
        type: studyReports.reportType,
        study_id: studyReports.studyId,
        study_title: studies.name,
        generated_at: studyReports.createdAt,
        file_path: studyReports.filePath,
        parameters: studyReports.parameters,
      })
      .from(studyReports)
      .leftJoin(studies, eq(studyReports.studyId, studies.id))
      .where(and(...conditions))
      .orderBy(desc(studyReports.createdAt));

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, studyId, parameters = {} } = body;

    if (!title || !type || !studyId) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, studyId" },
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

    // Create the report record
    const reportData = {
      studyId,
      reportType: type,
      fileName: title,
      filePath: null,
      format: "pdf" as const,
      parameters: JSON.stringify(parameters),
      generatedBy: session.user.id,
      createdAt: new Date(),
    };

    const insertResult = await db
      .insert(studyReports)
      .values(reportData);

    return NextResponse.json({ 
      success: true, 
      message: "Report created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
