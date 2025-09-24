"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const createStudySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  product: z.string().min(1, "Product is required"),
  machine: z.string().min(1, "Machine is required"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type StudyFormData = z.infer<typeof createStudySchema>;

export default function NewStudyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudyFormData>({
    resolver: zodResolver(createStudySchema),
  });

  const duration = watch("duration");

  // Auto-calculate end date based on start date and duration
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      setValue("startDate", date);
      
      if (duration && duration > 0) {
        const calculatedEndDate = new Date(date);
        calculatedEndDate.setDate(calculatedEndDate.getDate() + duration - 1);
        setEndDate(calculatedEndDate);
        setValue("endDate", calculatedEndDate);
      }
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value);
    setValue("duration", newDuration);
    
    if (startDate && newDuration > 0) {
      const calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + newDuration - 1);
      setEndDate(calculatedEndDate);
      setValue("endDate", calculatedEndDate);
    }
  };

  const onSubmit = async (data: StudyFormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/studies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create study");
      }

      const result = await response.json();
      router.push(`/studies/${result.study.id}`);
    } catch (error) {
      console.error("Error creating study:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="mb-6">
        <Link href="/studies">
          <Button variant="ghost" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Studies
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Study</h1>
          <p className="text-muted-foreground">
            Set up a new zero loss study to track machine performance and downtime.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Study Setup</CardTitle>
          <CardDescription>
            Enter the basic information for your zero loss study.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Study Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Machine A July 2024 Study"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Optional description of the study goals and scope"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Input
                  id="product"
                  {...register("product")}
                  placeholder="e.g., Widget Model X"
                />
                {errors.product && (
                  <p className="text-sm text-red-600">{errors.product.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="machine">Machine *</Label>
                <Input
                  id="machine"
                  {...register("machine")}
                  placeholder="e.g., Machine Line A1"
                />
                {errors.machine && (
                  <p className="text-sm text-red-600">{errors.machine.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                {...register("duration", { valueAsNumber: true })}
                onChange={handleDurationChange}
                placeholder="e.g., 30"
              />
              {errors.duration && (
                <p className="text-sm text-red-600">{errors.duration.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        if (date) setValue("endDate", date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Link href="/studies">
                <Button variant="outline" type="button" className="cursor-pointer">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="cursor-pointer">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Study
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
