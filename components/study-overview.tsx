"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatNumber, formatPercentage, formatLocaleNumber } from "@/lib/format";

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

interface StudyOverviewProps {
  summary: StudySummary;
}

export default function StudyOverview({ summary }: StudyOverviewProps) {
  const {
    downtime,
    cycleTime,
    production,
    performance,
  } = summary;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OEE Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performance.oeeScore)}</div>
            <Progress value={performance.oeeScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performance.qualityRate)}</div>
            <p className="text-xs text-muted-foreground">
              {formatLocaleNumber(production.totalGoodPieces)} good pieces
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Availability</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performance.availabilityRate)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(downtime.totalDowntime)} min downtime
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performance.performanceRate)}</div>
            <p className="text-xs text-muted-foreground">
              Avg efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Production Summary */}
        <Card className="cursor-pointer">
          <CardHeader>
            <CardTitle>Production Summary</CardTitle>
            <CardDescription>Overview of pieces produced and quality metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Good Pieces</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-600">
                  {formatLocaleNumber(production.totalGoodPieces)}
                </span>
                <Badge variant="secondary" className="bg-green-500 text-white uppercase font-semibold">
                  {formatPercentage(production.qualityRate)}
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Defect Pieces</span>
              <span className="text-sm font-bold text-red-600">
                {formatLocaleNumber(production.totalDefectPieces)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Rework Pieces</span>
              <span className="text-sm font-bold text-yellow-600">
                {formatLocaleNumber(production.totalReworkPieces)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Scrap Pieces</span>
              <span className="text-sm font-bold text-red-600">
                {formatLocaleNumber(production.totalScrapPieces)}
              </span>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Produced</span>
                <span className="font-bold">{formatLocaleNumber(production.totalProduced)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Target</span>
                <span>{formatLocaleNumber(production.totalTargetPieces)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Downtime Analysis */}
        <Card className="cursor-pointer">
          <CardHeader>
            <CardTitle>Downtime Analysis</CardTitle>
            <CardDescription>Machine downtime incidents and categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Incidents</span>
              <span className="text-sm font-bold">{downtime.totalIncidents}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Downtime</span>
              <span className="text-sm font-bold">{formatNumber(downtime.totalDowntime)} minutes</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average per Incident</span>
              <span className="text-sm font-bold">
                {formatNumber(downtime.averageDowntime || 0)} minutes
              </span>
            </div>

            {downtime.topLossCategories.length > 0 && (
              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2">Top Loss Categories</h4>
                <div className="space-y-2">
                  {downtime.topLossCategories.slice(0, 3).map((category, index) => (
                    <div key={category.category} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        {category.category}
                      </span>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(category.totalDuration)} min</div>
                        <div className="text-xs text-muted-foreground">
                          {category.count} incidents
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cycle Time Performance */}
      <Card className="cursor-pointer">
        <CardHeader>
          <CardTitle>Cycle Time Performance</CardTitle>
          <CardDescription>Machine cycle time efficiency and targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(cycleTime.averageCycleTime || 0)}s</div>
              <p className="text-sm text-muted-foreground">Average Cycle Time</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(cycleTime.averageTargetTime || 0)}s</div>
              <p className="text-sm text-muted-foreground">Target Time</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{formatPercentage(cycleTime.averageEfficiency || 0)}</div>
              <p className="text-sm text-muted-foreground">Efficiency</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{cycleTime.totalRecords}</div>
              <p className="text-sm text-muted-foreground">Data Points</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
