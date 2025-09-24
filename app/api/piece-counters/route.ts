import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pieceCounters } from "@/db/schema/studies";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for piece counters data creation
const createPieceCountersSchema = z.object({
    studyId: z.string().uuid(),
    date: z.string().transform((str) => new Date(str)),
    shift: z.enum(["1", "2", "3"]),
    goodPieces: z.number().min(0, "Good pieces must be positive").default(0),
    defectPieces: z.number().min(0, "Defect pieces must be positive").default(0),
    reworkPieces: z.number().min(0, "Rework pieces must be positive").default(0),
    scrapPieces: z.number().min(0, "Scrap pieces must be positive").default(0),
    targetPieces: z.number().min(1, "Target pieces must be at least 1"),
    operator: z.string().optional(),
    notes: z.string().optional(),
});

// GET /api/piece-counters?studyId={id} - Get piece counters data for a specific study
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
            .from(pieceCounters)
            .where(eq(pieceCounters.studyId, studyId))
            .orderBy(desc(pieceCounters.date), pieceCounters.shift);

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error fetching piece counters data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/piece-counters - Create new piece counters data entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createPieceCountersSchema.parse(body);

        await db
            .insert(pieceCounters)
            .values(validatedData);

        return NextResponse.json({ data: validatedData }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error creating piece counters data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
