"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, BarChart3, Database, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { calculatePercentage } from "@/lib/format";
import StudyOverview from "@/components/study-overview";
import DataEntryTabs from "@/components/data-entry-tabs";
import ParetoChart from "@/components/pareto-chart";

interface Study {
  id: string;
  name: string;
  description?: string;
  product: string;
  machine: string;
  duration: number;
  startDate: string;
  endDate: string;
  status: "preparation" | "input" | "output" | "completed";
  createdAt: string;
}

interface StudySummary {
  study: {
    id: string;
    name: string;
    status: string;
    duration: number;
  };
  downtime: {
    totalDowntime: number;
    totalIncidents: number;
    averageDowntime: number;
    topLossCategories: Array<{
      category: string;
      totalDuration: number;
      count: number;
    }>;
  };
  cycleTime: {
    averageCycleTime: number;
    averageTargetTime: number;
    averageEfficiency: number;
    totalRecords: number;
  };
  production: {
    totalGoodPieces: number;
    totalDefectPieces: number;
    totalReworkPieces: number;
    totalScrapPieces: number;
    totalTargetPieces: number;
    totalProduced: number;
    qualityRate: number;
  };
  performance: {
    qualityRate: number;
    availabilityRate: number;
    performanceRate: number;
    oeeScore: number;
  };
}

const statusColors = {
  preparation: "bg-blue-500 text-white uppercase font-semibold",
  input: "bg-yellow-500 text-white uppercase font-semibold",
  output: "bg-green-500 text-white uppercase font-semibold",
  completed: "bg-gray-500 text-white uppercase font-semibold",
};

export default function StudyDetailPage() {
  const params = useParams();
  const studyId = params.id as string;

  const [study, setStudy] = useState<Study | null>(null);
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studyId) {
      fetchStudyData();
    }
  }, [studyId]);

  const fetchStudyData = async () => {
    try {
      // Fetch study details with summary data
      const response = await fetch(`/api/studies/${studyId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch study");
      }

      const data = await response.json();
      setStudy(data.study);
      
      // Convert API response to expected format
      const summaryData: StudySummary = {
        study: {
          id: data.study.id,
          name: data.study.name,
          status: data.study.status,
          duration: data.study.duration,
        },
        downtime: data.downtime,
        cycleTime: data.cycleTime,
        production: {
          totalGoodPieces: data.production.totalGood,
          totalDefectPieces: data.production.totalDefect,
          totalReworkPieces: data.production.totalRework,
          totalScrapPieces: data.production.totalScrap,
          totalTargetPieces: data.production.totalTarget,
          totalProduced: data.production.totalGood + data.production.totalDefect + data.production.totalRework,
          qualityRate: calculatePercentage(data.production.totalGood, data.production.totalGood + data.production.totalDefect),
        },
        performance: {
          qualityRate: calculatePercentage(data.production.totalGood, data.production.totalGood + data.production.totalDefect),
          availabilityRate: 85, // Mock value
          performanceRate: data.cycleTime.averageEfficiency || 0,
          oeeScore: 0, // Will be calculated
        },
      };
      
      // Calculate OEE score
      summaryData.performance.oeeScore = parseFloat((
        (summaryData.performance.qualityRate / 100) *
        (summaryData.performance.availabilityRate / 100) *
        (summaryData.performance.performanceRate / 100) * 100
      ).toFixed(2));

      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading study...</span>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-600 mb-4">Error: {error || "Study not found"}</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="mb-6">
        <Link href="/studies">
          <Button variant="ghost" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Studies
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{study.name}</h1>
              <Badge className={statusColors[study.status]}>
                {study.status}
              </Badge>
            </div>
            {study.description && (
              <p className="text-muted-foreground mb-2">{study.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {format(new Date(study.startDate), "MMM dd, yyyy")} -{" "}
                {format(new Date(study.endDate), "MMM dd, yyyy")}
              </div>
              <span>{study.product}</span>
              <span>{study.machine}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/studies/${studyId}/settings`}>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
          <TabsTrigger value="data-entry" className="cursor-pointer">Data Entry</TabsTrigger>
          <TabsTrigger value="analytics" className="cursor-pointer">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {summary && <StudyOverview summary={summary} />}
        </TabsContent>

        <TabsContent value="data-entry">
          <DataEntryTabs studyId={studyId} onDataSaved={fetchStudyData} />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card className="cursor-pointer">
              <CardHeader>
                <CardTitle>Pareto Chart - Loss Analysis</CardTitle>
                <CardDescription>
                  Identifies the most significant causes of downtime by frequency and impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParetoChart studyId={studyId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
