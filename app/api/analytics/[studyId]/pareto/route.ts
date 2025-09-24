import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studies, s1Data } from "@/db/schema/studies";
import { eq, and, sum, count, desc } from "drizzle-orm";

interface ParetoItem {
    category: string;
    reason: string;
    label: string;
    duration: number;
    percentage: number;
    cumulativePercentage: number;
    occurrences: number;
}

// GET /api/analytics/[studyId]/pareto - Generate Pareto chart data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ studyId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { studyId } = await params;

        // Verify study belongs to user
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

        // Get S1 data grouped by category and reason
        const s1Summary = await db
            .select({
                category: s1Data.lossCategory,
                reason: s1Data.lossReason,
                totalDuration: sum(s1Data.duration),
                occurrences: count(s1Data.id),
            })
            .from(s1Data)
            .where(eq(s1Data.studyId, studyId))
            .groupBy(s1Data.lossCategory, s1Data.lossReason)
            .orderBy(desc(sum(s1Data.duration)));

        // Calculate totals
        const totalDuration = s1Summary.reduce((acc, item) => acc + Number(item.totalDuration || 0), 0);
        const totalOccurrences = s1Summary.reduce((acc, item) => acc + Number(item.occurrences), 0);

        // Create Pareto data with cumulative percentages
        let cumulativePercentage = 0;
        const paretoData: ParetoItem[] = s1Summary.map((item) => {
            const duration = Number(item.totalDuration || 0);
            const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
            cumulativePercentage += percentage;

            return {
                category: item.category,
                reason: item.reason,
                label: `${item.category}: ${item.reason}`,
                duration: duration,
                percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
                cumulativePercentage: Math.round(cumulativePercentage * 10) / 10,
                occurrences: Number(item.occurrences),
            };
        });

        const response = {
            paretoData,
            totalDuration,
            totalOccurrences,
            studyInfo: {
                id: study[0].id,
                name: study[0].name,
                status: study[0].status,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error generating Pareto analysis:", error);
        return NextResponse.json(
            { error: "Failed to generate Pareto analysis" },
            { status: 500 }
        );
    }
}
