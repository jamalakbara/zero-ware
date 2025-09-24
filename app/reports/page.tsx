"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DownloadIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  TrendingUpIcon,
  BarChart3Icon,
  PieChartIcon,
} from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: number;
  title: string;
  type: string;
  study_id: number;
  study_title: string;
  generated_at: string;
  file_path?: string;
  parameters: any;
}

interface Study {
  id: number;
  title: string;
}

const reportTypes = [
  {
    id: "loss-summary",
    name: "Loss Summary Report",
    description: "Comprehensive overview of all loss categories and their impact",
    icon: PieChartIcon,
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: "oee-analysis",
    name: "OEE Analysis Report",
    description: "Overall Equipment Effectiveness metrics and trends",
    icon: TrendingUpIcon,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "cycle-time",
    name: "Cycle Time Report",
    description: "Detailed cycle time analysis and performance metrics",
    icon: BarChart3Icon,
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: "production-summary",
    name: "Production Summary",
    description: "Production output and efficiency summary",
    icon: FileTextIcon,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStudy, setSelectedStudy] = useState<string>("all");
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchReports();
      fetchStudies();
    }
  }, [session]);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const generateReport = async (type: string) => {
    if (!selectedStudy || selectedStudy === "all") {
      alert("Please select a specific study to generate a report");
      return;
    }

    setGenerating(type);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          studyId: parseInt(selectedStudy),
          parameters: {
            dateRange: "30", // Default to 30 days
            includeCharts: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh reports list
        await fetchReports();
        alert("Report generated successfully!");
      } else {
        alert("Failed to generate report");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Error generating report");
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (reportId: number) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download report");
      }
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Error downloading report");
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.study_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || report.type === selectedType;
    const matchesStudy = selectedStudy === "all" || report.study_id.toString() === selectedStudy;
    return matchesSearch && matchesType && matchesStudy;
  });

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card className="cursor-pointer">
          <CardContent className="pt-6">
            <p>Please sign in to access reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage comprehensive zero loss reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="cursor-pointer">Generate Reports</TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Study Selection */}
          <Card className="cursor-pointer">
            <CardHeader>
              <CardTitle>Select Study</CardTitle>
              <CardDescription>
                Choose a study to generate reports for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedStudy} onValueChange={setSelectedStudy}>
                <SelectTrigger className="w-full max-w-md cursor-pointer">
                  <SelectValue placeholder="Select a study" />
                </SelectTrigger>
                <SelectContent>
                  {studies.map((study) => (
                    <SelectItem key={study.id} value={study.id.toString()} className="cursor-pointer">
                      {study.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Report Types */}
          <div className="grid gap-6 md:grid-cols-2">
            {reportTypes.map((reportType) => {
              const Icon = reportType.icon;
              return (
                <Card key={reportType.id} className={`border-2 ${reportType.color} cursor-pointer`}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-white">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{reportType.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {reportType.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => generateReport(reportType.id)}
                      disabled={!selectedStudy || selectedStudy === "all" || generating === reportType.id}
                      className="w-full cursor-pointer"
                    >
                      {generating === reportType.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileTextIcon className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px] cursor-pointer">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
                {reportTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="cursor-pointer">
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStudy} onValueChange={setSelectedStudy}>
              <SelectTrigger className="w-[200px] cursor-pointer">
                <SelectValue placeholder="Study" />
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
          </div>

          {/* Reports Table */}
          <Card className="cursor-pointer">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
                  <p>Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="p-6 text-center">
                  <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                  <p className="text-muted-foreground">
                    Generate your first report to get started
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Study</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => {
                      const reportType = reportTypes.find(t => t.id === report.type);
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {report.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {reportType?.name || report.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{report.study_title}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center">
                              <CalendarIcon className="mr-1 h-4 w-4" />
                              {format(new Date(report.generated_at), "MMM dd, yyyy HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadReport(report.id)}
                                className="cursor-pointer"
                              >
                                <DownloadIcon className="mr-1 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
