import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studies, s1Data, ctData, pieceCounters } from "@/db/schema/studies";
import { eq, and, sum, count, avg, desc, gte, lte, sql, inArray } from "drizzle-orm";

interface AnalyticsData {
  totalLoss: number;
  averageCycleTime: number;
  totalProduction: number;
  oeeScore: number;
  lossCategories: Array<{
    category: string;
    total_duration: number;
    count: number;
  }>;
  cycleTimeTrends: Array<{
    date: string;
    avg_cycle_time: number;
    target_cycle_time: number;
  }>;
  productionTrends: Array<{
    date: string;
    total_pieces: number;
    shift: string;
  }>;
}

// GET /api/analytics - Get analytics data across studies
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const studyId = searchParams.get("studyId");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Build base query conditions
    let studyConditions = eq(studies.createdBy, session.user.id);
    if (studyId && studyId !== "all") {
      studyConditions = and(studyConditions, eq(studies.id, studyId)) as any;
    }

    // Get user's studies
    const userStudies = await db
      .select({ id: studies.id })
      .from(studies)
      .where(studyConditions);

    const studyIds = userStudies.map(s => s.id);

    if (studyIds.length === 0) {
      return NextResponse.json({
        totalLoss: 0,
        averageCycleTime: 0,
        totalProduction: 0,
        oeeScore: 0,
        lossCategories: [],
        cycleTimeTrends: [],
        productionTrends: [],
      });
    }

    // Get S1 data (loss analysis)
    const s1Summary = await db
      .select({
        category: s1Data.lossCategory,
        total_duration: sum(s1Data.duration),
        count: count(s1Data.id),
      })
      .from(s1Data)
      .where(and(
        inArray(s1Data.studyId, studyIds),
        gte(s1Data.date, startDate),
        lte(s1Data.date, endDate)
      ))
      .groupBy(s1Data.lossCategory)
      .orderBy(desc(sum(s1Data.duration)));

    // Get CT data summary
    const ctSummary = await db
      .select({
        avgCycleTime: avg(ctData.cycleTime),
      })
      .from(ctData)
      .where(and(
        inArray(ctData.studyId, studyIds),
        gte(ctData.date, startDate),
        lte(ctData.date, endDate)
      ));

    // Get production summary
    const productionSummary = await db
      .select({
        totalGood: sum(pieceCounters.goodPieces),
        totalDefect: sum(pieceCounters.defectPieces),
        totalRework: sum(pieceCounters.reworkPieces),
        totalScrap: sum(pieceCounters.scrapPieces),
      })
      .from(pieceCounters)
      .where(and(
        inArray(pieceCounters.studyId, studyIds),
        gte(pieceCounters.date, startDate),
        lte(pieceCounters.date, endDate)
      ));

    // Get cycle time trends (daily averages)
    const cycleTimeTrends = await db
      .select({
        date: sql<string>`DATE(${ctData.date})`.as('date'),
        avg_cycle_time: avg(ctData.cycleTime),
        target_cycle_time: avg(ctData.targetCycleTime),
      })
      .from(ctData)
      .where(and(
        inArray(ctData.studyId, studyIds),
        gte(ctData.date, startDate),
        lte(ctData.date, endDate)
      ))
      .groupBy(sql`DATE(${ctData.date})`)
      .orderBy(sql`DATE(${ctData.date})`);

    // Get production trends (daily totals)
    const productionTrends = await db
      .select({
        date: sql<string>`DATE(${pieceCounters.date})`.as('date'),
        total_pieces: sum(sql`${pieceCounters.goodPieces} + ${pieceCounters.defectPieces} + ${pieceCounters.reworkPieces}`),
        shift: pieceCounters.shift,
      })
      .from(pieceCounters)
      .where(and(
        inArray(pieceCounters.studyId, studyIds),
        gte(pieceCounters.date, startDate),
        lte(pieceCounters.date, endDate)
      ))
      .groupBy(sql`DATE(${pieceCounters.date})`, pieceCounters.shift)
      .orderBy(sql`DATE(${pieceCounters.date})`, pieceCounters.shift);

    // Calculate totals
    const totalLoss = s1Summary.reduce((acc, item) => acc + Number(item.total_duration || 0), 0);
    const averageCycleTime = Number(ctSummary[0]?.avgCycleTime || 0);
    
    const totalGood = Number(productionSummary[0]?.totalGood || 0);
    const totalDefect = Number(productionSummary[0]?.totalDefect || 0);
    const totalRework = Number(productionSummary[0]?.totalRework || 0);
    const totalScrap = Number(productionSummary[0]?.totalScrap || 0);
    const totalProduction = totalGood + totalDefect + totalRework;

    // Calculate OEE (simplified)
    const qualityRate = totalProduction > 0 ? (totalGood / totalProduction) * 100 : 0;
    const availabilityRate = 85; // Mock - would be calculated from actual downtime data
    const performanceRate = 80; // Mock - would be calculated from cycle time efficiency
    const oeeScore = (qualityRate / 100) * (availabilityRate / 100) * (performanceRate / 100) * 100;

    const analyticsData: AnalyticsData = {
      totalLoss,
      averageCycleTime,
      totalProduction,
      oeeScore,
      lossCategories: s1Summary.map(item => ({
        category: item.category,
        total_duration: Number(item.total_duration || 0),
        count: Number(item.count),
      })),
      cycleTimeTrends: cycleTimeTrends.map(item => ({
        date: item.date,
        avg_cycle_time: Number(item.avg_cycle_time || 0),
        target_cycle_time: Number(item.target_cycle_time || 0),
      })),
      productionTrends: productionTrends.map(item => ({
        date: item.date,
        total_pieces: Number(item.total_pieces || 0),
        shift: item.shift,
      })),
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
