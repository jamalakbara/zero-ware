"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface DataEntryTabsProps {
  studyId: string;
  onDataSaved?: () => void;
}

// S1 Data Schema
const s1DataSchema = z.object({
  date: z.date(),
  shift: z.enum(["1", "2", "3"]),
  lossCategory: z.string().min(1, "Loss category is required"),
  lossReason: z.string().min(1, "Loss reason is required"),
  duration: z.number().min(0, "Duration must be positive"),
  impact: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
});

// CT Data Schema
const ctDataSchema = z.object({
  date: z.date(),
  shift: z.enum(["1", "2", "3"]),
  cycleTime: z.number().min(0, "Cycle time must be positive"),
  targetCycleTime: z.number().min(0, "Target cycle time must be positive"),
  operator: z.string().optional(),
  notes: z.string().optional(),
});

// Piece Counter Schema
const pieceCounterSchema = z.object({
  date: z.date(),
  shift: z.enum(["1", "2", "3"]),
  goodPieces: z.number().min(0),
  defectPieces: z.number().min(0),
  reworkPieces: z.number().min(0),
  scrapPieces: z.number().min(0),
  targetPieces: z.number().min(1, "Target pieces must be at least 1"),
  operator: z.string().optional(),
  notes: z.string().optional(),
});

type S1DataForm = z.infer<typeof s1DataSchema>;
type CTDataForm = z.infer<typeof ctDataSchema>;
type PieceCounterForm = z.infer<typeof pieceCounterSchema>;

export default function DataEntryTabs({ studyId, onDataSaved }: DataEntryTabsProps) {
  const [activeTab, setActiveTab] = useState("s1");
  const [loading, setLoading] = useState({ s1: false, ct: false, pieces: false });

  // S1 Data Form
  const s1Form = useForm<S1DataForm>({
    resolver: zodResolver(s1DataSchema),
    defaultValues: {
      impact: "medium",
    } as Partial<S1DataForm>,
  });

  const [s1Date, setS1Date] = useState<Date>();

  const submitS1Data = async (data: S1DataForm) => {
    setLoading(prev => ({ ...prev, s1: true }));
    try {
      const response = await fetch("/api/s1-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyId,
          ...data,
          date: data.date.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save S1 data");
      }

      s1Form.reset();
      setS1Date(undefined);
      alert("S1 data saved successfully!");
      
      // Refresh parent data
      if (onDataSaved) {
        onDataSaved();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(prev => ({ ...prev, s1: false }));
    }
  };

  // CT Data Form
  const ctForm = useForm<CTDataForm>({
    resolver: zodResolver(ctDataSchema),
  });

  const [ctDate, setCTDate] = useState<Date>();

  const submitCTData = async (data: CTDataForm) => {
    setLoading(prev => ({ ...prev, ct: true }));
    try {
      const response = await fetch("/api/ct-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyId,
          ...data,
          date: data.date.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save CT data");
      }

      ctForm.reset();
      setCTDate(undefined);
      alert("CT data saved successfully!");
      
      // Refresh parent data
      if (onDataSaved) {
        onDataSaved();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(prev => ({ ...prev, ct: false }));
    }
  };

  // Piece Counter Form
  const pieceForm = useForm<PieceCounterForm>({
    resolver: zodResolver(pieceCounterSchema),
    defaultValues: {
      goodPieces: 0,
      defectPieces: 0,
      reworkPieces: 0,
      scrapPieces: 0,
    },
  });

  const [pieceDate, setPieceDate] = useState<Date>();

  const submitPieceData = async (data: PieceCounterForm) => {
    setLoading(prev => ({ ...prev, pieces: true }));
    try {
      const response = await fetch("/api/piece-counters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyId,
          ...data,
          date: data.date.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save piece counter data");
      }

      pieceForm.reset();
      setPieceDate(undefined);
      alert("Piece counter data saved successfully!");
      
      // Refresh parent data
      if (onDataSaved) {
        onDataSaved();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(prev => ({ ...prev, pieces: false }));
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="s1" className="cursor-pointer">S1 - Loss Data</TabsTrigger>
        <TabsTrigger value="ct" className="cursor-pointer">CT - Cycle Time</TabsTrigger>
        <TabsTrigger value="pieces" className="cursor-pointer">Piece Counters</TabsTrigger>
      </TabsList>

      <TabsContent value="s1">
        <Card className="cursor-pointer">
          <CardHeader>
            <CardTitle>S1 - Machine Loss Data Entry</CardTitle>
            <CardDescription>
              Record machine downtime, loss categories, and reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={s1Form.handleSubmit(submitS1Data)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal cursor-pointer",
                          !s1Date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {s1Date ? format(s1Date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={s1Date}
                        onSelect={(date) => {
                          setS1Date(date);
                          if (date) s1Form.setValue("date", date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {s1Form.formState.errors.date && (
                    <p className="text-sm text-red-600">{s1Form.formState.errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Shift *</Label>
                  <Select onValueChange={(value: string) => s1Form.setValue("shift", value as "1" | "2" | "3")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Shift 1</SelectItem>
                      <SelectItem value="2">Shift 2</SelectItem>
                      <SelectItem value="3">Shift 3</SelectItem>
                    </SelectContent>
                  </Select>
                  {s1Form.formState.errors.shift && (
                    <p className="text-sm text-red-600">{s1Form.formState.errors.shift.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lossCategory">Loss Category *</Label>
                  <Input
                    id="lossCategory"
                    {...s1Form.register("lossCategory")}
                    placeholder="e.g., Mechanical, Electrical, Quality"
                  />
                  {s1Form.formState.errors.lossCategory && (
                    <p className="text-sm text-red-600">{s1Form.formState.errors.lossCategory.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lossReason">Loss Reason *</Label>
                  <Input
                    id="lossReason"
                    {...s1Form.register("lossReason")}
                    placeholder="Specific reason for the loss"
                  />
                  {s1Form.formState.errors.lossReason && (
                    <p className="text-sm text-red-600">{s1Form.formState.errors.lossReason.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    step="0.1"
                    {...s1Form.register("duration", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {s1Form.formState.errors.duration && (
                    <p className="text-sm text-red-600">{s1Form.formState.errors.duration.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Impact Level</Label>
                  <Select 
                    defaultValue="medium" 
                    onValueChange={(value: string) => s1Form.setValue("impact", value as "high" | "medium" | "low")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...s1Form.register("notes")}
                  placeholder="Additional notes about the incident"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading.s1} className="cursor-pointer">
                {loading.s1 && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save S1 Data
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ct">
        <Card className="cursor-pointer">
          <CardHeader>
            <CardTitle>CT - Cycle Time Data Entry</CardTitle>
            <CardDescription>
              Record machine cycle time measurements and efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={ctForm.handleSubmit(submitCTData)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal cursor-pointer",
                          !ctDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {ctDate ? format(ctDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={ctDate}
                        onSelect={(date) => {
                          setCTDate(date);
                          if (date) ctForm.setValue("date", date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {ctForm.formState.errors.date && (
                    <p className="text-sm text-red-600">{ctForm.formState.errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Shift *</Label>
                  <Select onValueChange={(value: string) => ctForm.setValue("shift", value as "1" | "2" | "3")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Shift 1</SelectItem>
                      <SelectItem value="2">Shift 2</SelectItem>
                      <SelectItem value="3">Shift 3</SelectItem>
                    </SelectContent>
                  </Select>
                  {ctForm.formState.errors.shift && (
                    <p className="text-sm text-red-600">{ctForm.formState.errors.shift.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cycleTime">Cycle Time (seconds) *</Label>
                  <Input
                    id="cycleTime"
                    type="number"
                    min="0"
                    step="0.01"
                    {...ctForm.register("cycleTime", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {ctForm.formState.errors.cycleTime && (
                    <p className="text-sm text-red-600">{ctForm.formState.errors.cycleTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetCycleTime">Target Cycle Time (seconds) *</Label>
                  <Input
                    id="targetCycleTime"
                    type="number"
                    min="0"
                    step="0.01"
                    {...ctForm.register("targetCycleTime", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {ctForm.formState.errors.targetCycleTime && (
                    <p className="text-sm text-red-600">{ctForm.formState.errors.targetCycleTime.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctOperator">Operator</Label>
                <Input
                  id="ctOperator"
                  {...ctForm.register("operator")}
                  placeholder="Operator name or ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctNotes">Notes</Label>
                <Textarea
                  id="ctNotes"
                  {...ctForm.register("notes")}
                  placeholder="Additional notes about the measurement"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading.ct} className="cursor-pointer">
                {loading.ct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save CT Data
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pieces">
        <Card className="cursor-pointer">
          <CardHeader>
            <CardTitle>Piece Counters Data Entry</CardTitle>
            <CardDescription>
              Record production counts for good, defect, rework, and scrap pieces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={pieceForm.handleSubmit(submitPieceData)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal cursor-pointer",
                          !pieceDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {pieceDate ? format(pieceDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={pieceDate}
                        onSelect={(date) => {
                          setPieceDate(date);
                          if (date) pieceForm.setValue("date", date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {pieceForm.formState.errors.date && (
                    <p className="text-sm text-red-600">{pieceForm.formState.errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Shift *</Label>
                  <Select onValueChange={(value: string) => pieceForm.setValue("shift", value as "1" | "2" | "3")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Shift 1</SelectItem>
                      <SelectItem value="2">Shift 2</SelectItem>
                      <SelectItem value="3">Shift 3</SelectItem>
                    </SelectContent>
                  </Select>
                  {pieceForm.formState.errors.shift && (
                    <p className="text-sm text-red-600">{pieceForm.formState.errors.shift.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goodPieces">Good Pieces</Label>
                  <Input
                    id="goodPieces"
                    type="number"
                    min="0"
                    {...pieceForm.register("goodPieces", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defectPieces">Defect Pieces</Label>
                  <Input
                    id="defectPieces"
                    type="number"
                    min="0"
                    {...pieceForm.register("defectPieces", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reworkPieces">Rework Pieces</Label>
                  <Input
                    id="reworkPieces"
                    type="number"
                    min="0"
                    {...pieceForm.register("reworkPieces", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scrapPieces">Scrap Pieces</Label>
                  <Input
                    id="scrapPieces"
                    type="number"
                    min="0"
                    {...pieceForm.register("scrapPieces", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetPieces">Target Pieces *</Label>
                <Input
                  id="targetPieces"
                  type="number"
                  min="1"
                  {...pieceForm.register("targetPieces", { valueAsNumber: true })}
                  placeholder="0"
                />
                {pieceForm.formState.errors.targetPieces && (
                  <p className="text-sm text-red-600">{pieceForm.formState.errors.targetPieces.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pieceOperator">Operator</Label>
                <Input
                  id="pieceOperator"
                  {...pieceForm.register("operator")}
                  placeholder="Operator name or ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pieceNotes">Notes</Label>
                <Textarea
                  id="pieceNotes"
                  {...pieceForm.register("notes")}
                  placeholder="Additional notes about production"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading.pieces} className="cursor-pointer">
                {loading.pieces && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Piece Data
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
