"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Trash2, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const updateStudySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  product: z.string().min(1, "Product is required"),
  machine: z.string().min(1, "Machine is required"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  status: z.enum(["preparation", "input", "output", "completed"]),
});

type UpdateStudyData = z.infer<typeof updateStudySchema>;

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

const statusOptions = [
  { value: "preparation", label: "Preparation", description: "Study is being set up" },
  { value: "input", label: "Input Phase", description: "Data collection in progress" },
  { value: "output", label: "Output Phase", description: "Analysis and reporting" },
  { value: "completed", label: "Completed", description: "Study is finished" },
];

const statusColors = {
  preparation: "bg-blue-500 text-white uppercase font-semibold",
  input: "bg-yellow-500 text-white uppercase font-semibold",
  output: "bg-green-500 text-white uppercase font-semibold",
  completed: "bg-gray-500 text-white uppercase font-semibold",
};

export default function StudySettingsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const studyId = params.id as string;

  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isDirty },
  } = useForm<UpdateStudyData>({
    resolver: zodResolver(updateStudySchema),
  });

  const watchedStatus = watch("status");

  useEffect(() => {
    if (session?.user && studyId) {
      fetchStudy();
    }
  }, [session, studyId]);

  const fetchStudy = async () => {
    try {
      const response = await fetch(`/api/studies/${studyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch study");
      }

      const data = await response.json();
      const studyData = data.study;
      setStudy(studyData);

      // Populate form
      setValue("name", studyData.name);
      setValue("description", studyData.description || "");
      setValue("product", studyData.product);
      setValue("machine", studyData.machine);
      setValue("duration", Number(studyData.duration));
      setValue("status", studyData.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UpdateStudyData) => {
    setSaving(true);
    console.log("Form data being submitted:", data);
    
    try {
      const response = await fetch(`/api/studies/${studyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to update study");
      }

      const result = await response.json();
      console.log("Success response:", result);

      // Update local state
      if (study) {
        setStudy({
          ...study,
          ...data,
        });
      }

      alert("Study updated successfully!");
    } catch (err) {
      console.error("Error updating study:", err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const deleteStudy = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/studies/${studyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete study");
      }

      alert("Study deleted successfully!");
      router.push("/studies");
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Please sign in to access study settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading study settings...</span>
        </div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Study</h3>
              <p className="text-muted-foreground mb-4">
                {error || "Study not found or access denied"}
              </p>
              <Link href="/studies">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Studies
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/studies/${studyId}`}>
            <Button variant="ghost" size="sm" className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Study Settings</h1>
            <p className="text-muted-foreground">
              Configure and manage your study
            </p>
          </div>
        </div>
        <Badge className={statusColors[study.status]}>
          {study.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of your study
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Study Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter study name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={watchedStatus} 
                      onValueChange={async (value: string) => {
                        setValue("status", value as "preparation" | "input" | "output" | "completed", { shouldDirty: true });
                        await trigger("status");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Enter study description"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Input
                      id="product"
                      {...register("product")}
                      placeholder="Product name"
                    />
                    {errors.product && (
                      <p className="text-sm text-red-600">{errors.product.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="machine">Machine</Label>
                    <Input
                      id="machine"
                      {...register("machine")}
                      placeholder="Machine name"
                    />
                    {errors.machine && (
                      <p className="text-sm text-red-600">{errors.machine.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      {...register("duration", { valueAsNumber: true })}
                      placeholder="30"
                      min="1"
                    />
                    {errors.duration && (
                      <p className="text-sm text-red-600">{errors.duration.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Link href={`/studies/${studyId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={!isDirty || saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Study Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Study ID</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {study.id}
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Study Period</Label>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>
                    {format(new Date(study.startDate), "MMM dd, yyyy")} -{" "}
                    {format(new Date(study.endDate), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(study.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete this study and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Study
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the study
                      <strong className="font-semibold"> "{study.name}"</strong> and all
                      associated data including S1 loss data, cycle time data, and piece
                      counter records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteStudy}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, delete study"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
