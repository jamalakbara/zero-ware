"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const studySchema = z.object({
  name: z.string().min(1, "Study name is required"),
  description: z.string().optional(),
  product: z.string().min(1, "Product is required"),
  machine: z.string().min(1, "Machine is required"),
  startDate: z.date(),
  endDate: z.date(),
  duration: z.number().min(1, "Duration must be at least 1 day"),
}).refine((data) => data.startDate && data.endDate, {
  message: "Both start and end dates are required",
  path: ["startDate"],
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type StudyFormData = z.infer<typeof studySchema>;

interface NewStudyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudyCreated?: () => void;
}

export default function NewStudyModal({ open, onOpenChange, onStudyCreated }: NewStudyModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<StudyFormData>({
    resolver: zodResolver(studySchema),
    defaultValues: {
      name: "",
      description: "",
      product: "",
      machine: "",
      duration: 7,
    },
  });

  const onSubmit = async (data: StudyFormData) => {
    setLoading(true);
    try {
      // Calculate duration in days
      const durationInDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const response = await fetch("/api/studies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          product: data.product,
          machine: data.machine,
          duration: durationInDays,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create study");
      }

      const result = await response.json();
      
      // Reset form
      form.reset();
      
      // Close modal
      onOpenChange(false);
      
      // Callback to refresh data
      if (onStudyCreated) {
        onStudyCreated();
      }
      
      // Navigate to the new study
      router.push(`/studies/${result.study.id}`);
    } catch (error) {
      console.error("Error creating study:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Study</DialogTitle>
          <DialogDescription>
            Set up a new zero loss study to track machine performance and downtime.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Study Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter study name"
                disabled={loading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Brief description of the study"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Input
                  id="product"
                  {...form.register("product")}
                  placeholder="Product name"
                  disabled={loading}
                />
                {form.formState.errors.product && (
                  <p className="text-sm text-red-600">{form.formState.errors.product.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="machine">Machine *</Label>
                <Input
                  id="machine"
                  {...form.register("machine")}
                  placeholder="Machine identifier"
                  disabled={loading}
                />
                {form.formState.errors.machine && (
                  <p className="text-sm text-red-600">{form.formState.errors.machine.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                {...form.register("duration", { valueAsNumber: true })}
                placeholder="7"
                disabled={loading}
              />
              {form.formState.errors.duration && (
                <p className="text-sm text-red-600">{form.formState.errors.duration.message}</p>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Study Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal cursor-pointer",
                        !form.watch("startDate") && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("startDate") ? (
                        format(form.watch("startDate"), "PPP")
                      ) : (
                        <span>Pick start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("startDate")}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue("startDate", date);
                          form.trigger("startDate");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal cursor-pointer",
                        !form.watch("endDate") && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("endDate") ? (
                        format(form.watch("endDate"), "PPP")
                      ) : (
                        <span>Pick end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("endDate")}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue("endDate", date);
                          form.trigger("endDate");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.endDate && (
                  <p className="text-sm text-red-600">{form.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Study"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
