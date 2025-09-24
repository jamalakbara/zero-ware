import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studies, s1Data, ctData, pieceCounters } from "@/db/schema/studies";
import { eq, and, sum, count, avg, desc } from "drizzle-orm";

// GET /api/analytics/[studyId]/summary - Generate study summary analytics
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

        // Calculate totals and metrics
        const totalS1Duration = s1Summary.reduce((acc, item) => acc + Number(item.totalDuration || 0), 0);
        const totalS1Incidents = s1Summary.reduce((acc, item) => acc + Number(item.totalIncidents), 0);

        const totalGood = Number(pieceSummary[0]?.totalGood || 0);
        const totalDefect = Number(pieceSummary[0]?.totalDefect || 0);
        const totalRework = Number(pieceSummary[0]?.totalRework || 0);
        const totalScrap = Number(pieceSummary[0]?.totalScrap || 0);
        const totalTarget = Number(pieceSummary[0]?.totalTarget || 0);
        const totalProduced = totalGood + totalDefect + totalRework;

        const qualityRate = totalProduced > 0 ? (totalGood / totalProduced) * 100 : 0;
        const availabilityRate = 85; // Mock availability rate - would be calculated from actual data
        const performanceRate = Number(ctSummary[0]?.avgEfficiency || 0);
        const oeeScore = (qualityRate / 100) * (availabilityRate / 100) * (performanceRate / 100) * 100;

        const response = {
            study: {
                id: study[0].id,
                name: study[0].name,
                status: study[0].status,
                duration: study[0].duration,
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
                totalGoodPieces: totalGood,
                totalDefectPieces: totalDefect,
                totalReworkPieces: totalRework,
                totalScrapPieces: totalScrap,
                totalTargetPieces: totalTarget,
                totalProduced: totalProduced,
                qualityRate: Math.round(qualityRate * 10) / 10,
            },
            performance: {
                qualityRate: Math.round(qualityRate * 10) / 10,
                availabilityRate: availabilityRate,
                performanceRate: Math.round(performanceRate * 10) / 10,
                oeeScore: Math.round(oeeScore * 10) / 10,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error generating summary analytics:", error);
        return NextResponse.json(
            { error: "Failed to generate summary analytics" },
            { status: 500 }
        );
    }
}
