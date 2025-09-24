import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studies, s1Data, ctData, pieceCounters } from "@/db/schema/studies";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for study creation
const createStudySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    product: z.string().min(1, "Product is required"),
    machine: z.string().min(1, "Machine is required"),
    duration: z.number().min(1, "Duration must be at least 1 day"),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
});

// GET /api/studies - Get all studies for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get studies with data counts
        const userStudies = await db
            .select({
                id: studies.id,
                title: studies.name,
                description: studies.description,
                product: studies.product,
                machine: studies.machine,
                duration: studies.duration,
                start_date: studies.startDate,
                end_date: studies.endDate,
                status: studies.status,
                created_at: studies.createdAt,
            })
            .from(studies)
            .where(eq(studies.createdBy, session.user.id))
            .orderBy(desc(studies.createdAt));

        // Get data counts for each study
        const studiesWithCounts = await Promise.all(
            userStudies.map(async (study) => {
                const [s1Count] = await db
                    .select({ count: count() })
                    .from(s1Data)
                    .where(eq(s1Data.studyId, study.id));
                
                const [ctCount] = await db
                    .select({ count: count() })
                    .from(ctData)
                    .where(eq(ctData.studyId, study.id));
                
                const [pieceCount] = await db
                    .select({ count: count() })
                    .from(pieceCounters)
                    .where(eq(pieceCounters.studyId, study.id));

                return {
                    ...study,
                    _count: {
                        s1_data: s1Count.count,
                        ct_data: ctCount.count,
                        piece_counters: pieceCount.count,
                    }
                };
            })
        );

        return NextResponse.json(studiesWithCounts);
    } catch (error) {
        console.error("Error fetching studies:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/studies - Create a new study
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createStudySchema.parse(body);

        // Create the study
        const studyId = crypto.randomUUID();
        const studyData = {
            id: studyId,
            name: validatedData.name,
            description: validatedData.description || "",
            product: validatedData.product,
            machine: validatedData.machine,
            duration: validatedData.duration,
            startDate: validatedData.startDate,
            endDate: validatedData.endDate,
            status: "preparation" as const,
            createdBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const insertResult = await db
            .insert(studies)
            .values(studyData);

        return NextResponse.json({ 
            success: true,
            message: "Study created successfully",
            study: {
                id: studyId,
                title: validatedData.name,
                description: validatedData.description || "",
                product: validatedData.product,
                machine: validatedData.machine,
                duration: validatedData.duration,
                start_date: validatedData.startDate.toISOString(),
                end_date: validatedData.endDate.toISOString(),
                status: "preparation" as const,
                created_at: new Date().toISOString(),
            }
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error creating study:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
