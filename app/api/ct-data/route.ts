import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ctData } from "@/db/schema/studies";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for CT data creation
const createCTDataSchema = z.object({
    studyId: z.string().uuid(),
    date: z.string().transform((str) => new Date(str)),
    shift: z.enum(["1", "2", "3"]),
    cycleTime: z.number().min(0, "Cycle time must be positive"),
    targetCycleTime: z.number().min(0, "Target cycle time must be positive"),
    operator: z.string().optional(),
    notes: z.string().optional(),
});

// GET /api/ct-data?studyId={id} - Get CT data for a specific study
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studyId = searchParams.get("studyId");

        if (!studyId) {
            return NextResponse.json(
                { error: "Study ID is required" },
                { status: 400 }
            );
        }

        const data = await db
            .select()
            .from(ctData)
            .where(eq(ctData.studyId, studyId))
            .orderBy(desc(ctData.date), ctData.shift);

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error fetching CT data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/ct-data - Create new CT data entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createCTDataSchema.parse(body);

        // Calculate efficiency
        let efficiency = null;
        if (validatedData.targetCycleTime > 0) {
            efficiency = (validatedData.targetCycleTime / validatedData.cycleTime) * 100;
        }

        await db
            .insert(ctData)
            .values({
                studyId: validatedData.studyId,
                date: validatedData.date,
                shift: validatedData.shift,
                cycleTime: validatedData.cycleTime.toString(),
                targetCycleTime: validatedData.targetCycleTime.toString(),
                efficiency: efficiency?.toFixed(2),
                operator: validatedData.operator,
                notes: validatedData.notes,
            });

        // Return the data that was inserted
        const newEntry = {
            studyId: validatedData.studyId,
            date: validatedData.date,
            shift: validatedData.shift,
            cycleTime: validatedData.cycleTime.toString(),
            targetCycleTime: validatedData.targetCycleTime.toString(),
            efficiency: efficiency?.toFixed(2),
            operator: validatedData.operator,
            notes: validatedData.notes,
        };

        return NextResponse.json({ data: newEntry }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error creating CT data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
