"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PlusIcon, SettingsIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { useNewStudyModal } from "@/contexts/new-study-modal-context";

interface Study {
  id: number;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  _count?: {
    s1_data: number;
    ct_data: number;
    piece_counters: number;
  };
}

export default function StudiesPage() {
  const { data: session } = useSession();
  const { openModal, setOnStudyCreated } = useNewStudyModal();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStudies = useCallback(async () => {
    try {
      const response = await fetch("/api/studies");
      if (response.ok) {
        const data = await response.json();
        setStudies(data);
      } else {
        setError("Failed to load studies");
      }
    } catch (err) {
      setError("Error loading studies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchStudies();
    }
  }, [session, fetchStudies]);

  useEffect(() => {
    // Set callback untuk refresh data ketika study baru dibuat
    setOnStudyCreated(fetchStudies);
  }, [setOnStudyCreated, fetchStudies]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500 text-white uppercase font-semibold";
      case "completed":
        return "bg-blue-500 text-white uppercase font-semibold";
      case "paused":
        return "bg-yellow-500 text-white uppercase font-semibold";
      case "planning":
        return "bg-gray-500 text-white uppercase font-semibold";
      case "preparation":
        return "bg-blue-500 text-white uppercase font-semibold";
      case "input":
        return "bg-yellow-500 text-white uppercase font-semibold";
      case "output":
        return "bg-green-500 text-white uppercase font-semibold";
      default:
        return "bg-gray-500 text-white uppercase font-semibold";
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Please sign in to access studies.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Studies</h1>
            <p className="text-muted-foreground">Manage your zero loss studies</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studies</h1>
          <p className="text-muted-foreground">
            Manage and track your zero loss improvement studies
          </p>
        </div>
        <Button className="cursor-pointer" onClick={openModal}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Study
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Studies Grid */}
      {studies.length === 0 && !loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <TrendingUpIcon className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No studies yet</h3>
                <p className="text-muted-foreground">
                  Create your first zero loss study to start tracking improvements
                </p>
              </div>
              <Button onClick={openModal}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Study
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studies.map((study) => (
            <Card key={study.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{study.title}</CardTitle>
                    <Badge className={getStatusColor(study.status)}>
                      {study.status}
                    </Badge>
                  </div>
                  <Link href={`/studies/${study.id}/settings`}>
                    <Button variant="ghost" size="sm">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription className="line-clamp-2">
                  {study.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Study Dates */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>
                    {format(new Date(study.start_date), "MMM dd, yyyy")}
                    {study.end_date && (
                      <> - {format(new Date(study.end_date), "MMM dd, yyyy")}</>
                    )}
                  </span>
                </div>

                {/* Data Summary */}
                {study._count && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">
                        {study._count.s1_data}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        S1 Loss
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">
                        {study._count.ct_data}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cycle Time
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {study._count.piece_counters}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pieces
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/studies/${study.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/studies/${study.id}/data`} className="flex-1">
                    <Button className="w-full" size="sm">
                      Add Data
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
