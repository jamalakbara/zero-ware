import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studies, s1Data, ctData, pieceCounters } from "@/db/schema/studies";
import { eq, and, count, sum, avg, desc } from "drizzle-orm";
import { z } from "zod";

const updateStudySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    product: z.string().min(1).optional(),
    machine: z.string().min(1).optional(),
    duration: z.number().min(1).optional(),
    status: z.enum(["preparation", "input", "output", "completed"]).optional(),
});

// GET /api/studies/[id] - Get a specific study
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: studyId } = await params;

        // Get study details
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

        // Get S1 data summary
        const s1Summary = await db
            .select({
                totalDuration: sum(s1Data.duration),
                totalIncidents: count(s1Data.id),
                category: s1Data.lossCategory,
                categoryCount: count(s1Data.id),
            })
            .from(s1Data)
            .where(eq(s1Data.studyId, studyId))
            .groupBy(s1Data.lossCategory)
            .orderBy(desc(sum(s1Data.duration)));

        // Get CT data summary
        const ctSummary = await db
            .select({
                avgCycleTime: avg(ctData.cycleTime),
                avgTargetTime: avg(ctData.targetCycleTime),
                avgEfficiency: avg(ctData.efficiency),
                totalRecords: count(ctData.id),
            })
            .from(ctData)
            .where(eq(ctData.studyId, studyId));

        // Get piece counter summary
        const pieceSummary = await db
            .select({
                totalGood: sum(pieceCounters.goodPieces),
                totalDefect: sum(pieceCounters.defectPieces),
                totalRework: sum(pieceCounters.reworkPieces),
                totalScrap: sum(pieceCounters.scrapPieces),
                totalTarget: sum(pieceCounters.targetPieces),
                totalRecords: count(pieceCounters.id),
            })
            .from(pieceCounters)
            .where(eq(pieceCounters.studyId, studyId));

        // Calculate totals for S1 data
        const totalS1Duration = s1Summary.reduce((acc, item) => acc + Number(item.totalDuration || 0), 0);
        const totalS1Incidents = s1Summary.reduce((acc, item) => acc + Number(item.totalIncidents), 0);

        const response = {
            study: {
                id: study[0].id,
                name: study[0].name,
                description: study[0].description,
                product: study[0].product,
                machine: study[0].machine,
                duration: study[0].duration,
                startDate: study[0].startDate,
                endDate: study[0].endDate,
                status: study[0].status,
                createdAt: study[0].createdAt,
            },
            downtime: {
                totalDowntime: totalS1Duration,
                totalIncidents: totalS1Incidents,
                averageDowntime: totalS1Incidents > 0 ? totalS1Duration / totalS1Incidents : 0,
                topLossCategories: s1Summary.map(item => ({
                    category: item.category,
                    totalDuration: Number(item.totalDuration || 0),
                    count: Number(item.categoryCount),
                })),
            },
            cycleTime: {
                averageCycleTime: Number(ctSummary[0]?.avgCycleTime || 0),
                averageTargetTime: Number(ctSummary[0]?.avgTargetTime || 0),
                averageEfficiency: Number(ctSummary[0]?.avgEfficiency || 0),
                totalRecords: Number(ctSummary[0]?.totalRecords || 0),
            },
            production: {
                totalGood: Number(pieceSummary[0]?.totalGood || 0),
                totalDefect: Number(pieceSummary[0]?.totalDefect || 0),
                totalRework: Number(pieceSummary[0]?.totalRework || 0),
                totalScrap: Number(pieceSummary[0]?.totalScrap || 0),
                totalTarget: Number(pieceSummary[0]?.totalTarget || 0),
                totalRecords: Number(pieceSummary[0]?.totalRecords || 0),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching study:", error);
        return NextResponse.json(
            { error: "Failed to fetch study details" },
            { status: 500 }
        );
    }
}

// PUT /api/studies/[id] - Update a specific study
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: studyId } = await params;
        const body = await request.json();
        const validatedData = updateStudySchema.parse(body);

        // Verify the study belongs to the user
        const existingStudy = await db
            .select()
            .from(studies)
            .where(and(
                eq(studies.id, studyId),
                eq(studies.createdBy, session.user.id)
            ))
            .limit(1);

        if (existingStudy.length === 0) {
            return NextResponse.json(
                { error: "Study not found or access denied" },
                { status: 404 }
            );
        }

        // Update the study
        await db
            .update(studies)
            .set({
                ...(validatedData.name && { name: validatedData.name }),
                ...(validatedData.description !== undefined && { description: validatedData.description }),
                ...(validatedData.product && { product: validatedData.product }),
                ...(validatedData.machine && { machine: validatedData.machine }),
                ...(validatedData.duration && { duration: validatedData.duration }),
                ...(validatedData.status && { status: validatedData.status }),
                updatedAt: new Date(),
            })
            .where(eq(studies.id, studyId));

        return NextResponse.json({
            success: true,
            message: "Study updated successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error updating study:", error);
        return NextResponse.json(
            { error: "Failed to update study" },
            { status: 500 }
        );
    }
}

// DELETE /api/studies/[id] - Delete a specific study
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: studyId } = await params;

        // Verify the study belongs to the user
        const existingStudy = await db
            .select()
            .from(studies)
            .where(and(
                eq(studies.id, studyId),
                eq(studies.createdBy, session.user.id)
            ))
            .limit(1);

        if (existingStudy.length === 0) {
            return NextResponse.json(
                { error: "Study not found or access denied" },
                { status: 404 }
            );
        }

        // Delete the study (cascading deletes will handle related data)
        await db
            .delete(studies)
            .where(eq(studies.id, studyId));

        return NextResponse.json({
            success: true,
            message: "Study deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting study:", error);
        return NextResponse.json(
            { error: "Failed to delete study" },
            { status: 500 }
        );
    }
}
