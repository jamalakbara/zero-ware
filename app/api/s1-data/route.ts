import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { s1Data } from "@/db/schema/studies";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for S1 data creation
const createS1DataSchema = z.object({
    studyId: z.string().uuid(),
    date: z.string().transform((str) => new Date(str)),
    shift: z.enum(["1", "2", "3"]),
    lossCategory: z.string().min(1, "Loss category is required"),
    lossReason: z.string().min(1, "Loss reason is required"),
    duration: z.number().min(0, "Duration must be positive"),
    impact: z.enum(["high", "medium", "low"]).default("medium"),
    notes: z.string().optional(),
});

// GET /api/s1-data?studyId={id} - Get S1 data for a specific study
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
            .from(s1Data)
            .where(eq(s1Data.studyId, studyId))
            .orderBy(desc(s1Data.date), s1Data.shift);

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error fetching S1 data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/s1-data - Create new S1 data entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createS1DataSchema.parse(body);

        await db
            .insert(s1Data)
            .values({
                studyId: validatedData.studyId,
                date: validatedData.date,
                shift: validatedData.shift,
                lossCategory: validatedData.lossCategory,
                lossReason: validatedData.lossReason,
                duration: validatedData.duration, // int type, not string
                impact: validatedData.impact,
                notes: validatedData.notes,
            });

        // Return the data that was inserted
        const newEntry = {
            studyId: validatedData.studyId,
            date: validatedData.date.toISOString(),
            shift: validatedData.shift,
            lossCategory: validatedData.lossCategory,
            lossReason: validatedData.lossReason,
            duration: validatedData.duration,
            impact: validatedData.impact,
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

        console.error("Error creating S1 data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
