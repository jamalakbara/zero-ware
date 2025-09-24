"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Settings, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useNewStudyModal } from "@/contexts/new-study-modal-context";

interface Study {
  id: string;
  title: string; // API mengembalikan 'title' bukan 'name'
  description?: string;
  product: string;
  machine: string;
  duration: number;
  start_date: string; // API mengembalikan 'start_date' bukan 'startDate'
  end_date: string; // API mengembalikan 'end_date' bukan 'endDate'
  status: "preparation" | "input" | "output" | "completed";
  created_at: string; // API mengembalikan 'created_at' bukan 'createdAt'
}

const statusColors = {
  preparation: "bg-blue-500 text-white uppercase font-semibold",
  input: "bg-yellow-500 text-white uppercase font-semibold",
  output: "bg-green-500 text-white uppercase font-semibold", 
  completed: "bg-gray-500 text-white uppercase font-semibold",
};

export default function StudiesPage() {
  const { data: session, isPending } = useSession();
  const { openModal, setOnStudyCreated } = useNewStudyModal();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudies = useCallback(async () => {
    try {
      const response = await fetch("/api/studies");
      if (!response.ok) {
        throw new Error("Failed to fetch studies");
      }
      const data = await response.json();
      // API mengembalikan array langsung, bukan objek dengan property studies
      setStudies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStudies([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchStudies();
    } else if (!isPending && !session) {
      setLoading(false);
      setError("Please sign in to view studies");
    }
  }, [session, isPending, fetchStudies]);

  useEffect(() => {
    // Set callback untuk refresh data ketika study baru dibuat
    setOnStudyCreated(fetchStudies);
  }, [setOnStudyCreated, fetchStudies]);

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading studies...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Please sign in to view your studies</p>
        <Link href="/sign-in">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={fetchStudies} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zero Loss Studies</h1>
          <p className="text-muted-foreground">
            Manage your zero loss studies and track performance metrics
          </p>
        </div>
        <Button onClick={openModal} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          New Study
        </Button>
      </div>

      {studies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No studies yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first zero loss study to start tracking machine performance and downtime.
            </p>
            <Button onClick={openModal} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Create Study
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {studies.map((study) => (
            <Card key={study.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{study.title}</CardTitle>
                  <Badge className={statusColors[study.status]}>
                    {study.status}
                  </Badge>
                </div>
                <CardDescription>
                  {study.description || `${study.product} - ${study.machine}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(study.start_date), "MMM dd, yyyy")} -{" "}
                    {format(new Date(study.end_date), "MMM dd, yyyy")}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Product:</span> {study.product}
                    </div>
                    <div>
                      <span className="font-medium">Machine:</span> {study.machine}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {study.duration} days
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/studies/${study.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/studies/${study.id}/settings`}>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}