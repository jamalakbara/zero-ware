"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { CalendarIcon, TrendingUpIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";

interface Study {
  id: number;
  title: string;
  status: string;
}

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<string>("all");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    if (session?.user) {
      fetchStudies();
      fetchAnalytics();
    }
  }, [session, selectedStudy, dateRange]);

  const fetchStudies = async () => {
    try {
      const response = await fetch("/api/studies");
      if (response.ok) {
        const data = await response.json();
        setStudies(data);
      }
    } catch (err) {
      console.error("Error loading studies:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: dateRange,
        ...(selectedStudy !== "all" && { studyId: selectedStudy }),
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Please sign in to access analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getOEEColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getOEEBadge = (score: number) => {
    if (score >= 85) return { label: "EXCELLENT", color: "bg-green-500 text-white uppercase font-semibold" };
    if (score >= 70) return { label: "GOOD", color: "bg-yellow-500 text-white uppercase font-semibold" };
    return { label: "NEEDS IMPROVEMENT", color: "bg-red-500 text-white uppercase font-semibold" };
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your zero loss improvement initiatives
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedStudy} onValueChange={setSelectedStudy}>
            <SelectTrigger className="w-[200px] cursor-pointer">
              <SelectValue placeholder="Select Study" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Studies</SelectItem>
              {studies.map((study) => (
                <SelectItem key={study.id} value={study.id.toString()} className="cursor-pointer">
                  {study.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] cursor-pointer">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7" className="cursor-pointer">Last 7 days</SelectItem>
              <SelectItem value="30" className="cursor-pointer">Last 30 days</SelectItem>
              <SelectItem value="90" className="cursor-pointer">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="cursor-pointer">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Loss Time</CardTitle>
                <AlertCircleIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatDuration(analytics.totalLoss)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all loss categories
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.averageCycleTime.toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground">
                  Production cycle average
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Production</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.totalProduction.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pieces produced
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OEE Score</CardTitle>
                <div className="h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getOEEColor(analytics.oeeScore)}`}>
                  {analytics.oeeScore.toFixed(1)}%
                </div>
                <Badge className={getOEEBadge(analytics.oeeScore).color}>
                  {getOEEBadge(analytics.oeeScore).label}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="loss-analysis" className="space-y-4">
            <TabsList>
              <TabsTrigger value="loss-analysis" className="cursor-pointer">Loss Analysis</TabsTrigger>
              <TabsTrigger value="cycle-time" className="cursor-pointer">Cycle Time Trends</TabsTrigger>
              <TabsTrigger value="production" className="cursor-pointer">Production Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="loss-analysis" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="cursor-pointer">
                  <CardHeader>
                    <CardTitle>Loss by Category</CardTitle>
                    <CardDescription>
                      Total loss time breakdown by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.lossCategories}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [formatDuration(value), "Loss Time"]}
                        />
                        <Bar dataKey="total_duration" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer">
                  <CardHeader>
                    <CardTitle>Loss Distribution</CardTitle>
                    <CardDescription>
                      Percentage breakdown of loss categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.lossCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => 
                            `${category} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total_duration"
                        >
                          {analytics.lossCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [formatDuration(value), "Loss Time"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cycle-time">
              <Card className="cursor-pointer">
                <CardHeader>
                  <CardTitle>Cycle Time Trends</CardTitle>
                  <CardDescription>
                    Average cycle time vs target over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analytics.cycleTimeTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avg_cycle_time" 
                        stroke="#8884d8" 
                        name="Actual"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target_cycle_time" 
                        stroke="#82ca9d" 
                        name="Target"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="production">
              <Card className="cursor-pointer">
                <CardHeader>
                  <CardTitle>Production Trends</CardTitle>
                  <CardDescription>
                    Daily production output by shift
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analytics.productionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="total_pieces" 
                        stroke="#8884d8" 
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card className="cursor-pointer">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
