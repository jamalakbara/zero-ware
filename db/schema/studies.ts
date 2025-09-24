import { mysqlTable, varchar, timestamp, int, decimal, boolean, serial, datetime } from "drizzle-orm/mysql-core";
import { user } from "./auth";

// Main study table
export const studies = mysqlTable("studies", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    product: varchar("product", { length: 255 }).notNull(),
    machine: varchar("machine", { length: 255 }).notNull(),
    duration: int("duration").notNull(), // in days
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    status: varchar("status", { length: 20 })
        .$type<"preparation" | "input" | "output" | "completed">()
        .default("preparation")
        .notNull(),
    createdBy: varchar("created_by", { length: 255 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
});

// S1 Data - Machine downtime and loss data
export const s1Data = mysqlTable("s1_data", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    studyId: varchar("study_id", { length: 36 })
        .notNull()
        .references(() => studies.id, { onDelete: "cascade" }),
    date: datetime("date").notNull(),
    shift: varchar("shift", { length: 1 }).$type<"1" | "2" | "3">().notNull(),
    lossCategory: varchar("loss_category", { length: 100 }).notNull(), // e.g., "Mechanical", "Electrical", "Quality"
    lossReason: varchar("loss_reason", { length: 255 }).notNull(),
    duration: int("duration").notNull(), // in minutes
    impact: varchar("impact", { length: 10 }).$type<"high" | "medium" | "low">().default("medium"),
    notes: varchar("notes", { length: 1000 }),
    createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
});

// CT Data - Cycle time measurements
export const ctData = mysqlTable("ct_data", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    studyId: varchar("study_id", { length: 36 })
        .notNull()
        .references(() => studies.id, { onDelete: "cascade" }),
    date: datetime("date").notNull(),
    shift: varchar("shift", { length: 1 }).$type<"1" | "2" | "3">().notNull(),
    cycleTime: decimal("cycle_time", { precision: 10, scale: 2 }).notNull(), // in seconds
    targetCycleTime: decimal("target_cycle_time", { precision: 10, scale: 2 }).notNull(),
    efficiency: decimal("efficiency", { precision: 5, scale: 2 }), // calculated field
    operator: varchar("operator", { length: 100 }),
    notes: varchar("notes", { length: 1000 }),
    createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
});

// Piece Counters - Production count data
export const pieceCounters = mysqlTable("piece_counters", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    studyId: varchar("study_id", { length: 36 })
        .notNull()
        .references(() => studies.id, { onDelete: "cascade" }),
    date: datetime("date").notNull(),
    shift: varchar("shift", { length: 1 }).$type<"1" | "2" | "3">().notNull(),
    goodPieces: int("good_pieces").notNull().default(0),
    defectPieces: int("defect_pieces").notNull().default(0),
    reworkPieces: int("rework_pieces").notNull().default(0),
    scrapPieces: int("scrap_pieces").notNull().default(0),
    targetPieces: int("target_pieces").notNull(),
    operator: varchar("operator", { length: 100 }),
    notes: varchar("notes", { length: 1000 }),
    createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
});

// Study participants/access control
export const studyParticipants = mysqlTable("study_participants", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    studyId: varchar("study_id", { length: 36 })
        .notNull()
        .references(() => studies.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 10 }).$type<"owner" | "editor" | "viewer">()
        .default("viewer")
        .notNull(),
    createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Study reports/exports
export const studyReports = mysqlTable("study_reports", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    studyId: varchar("study_id", { length: 36 })
        .notNull()
        .references(() => studies.id, { onDelete: "cascade" }),
    reportType: varchar("report_type", { length: 20 }).$type<"pareto" | "summary" | "detailed" | "custom">().notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    filePath: varchar("file_path", { length: 500 }),
    format: varchar("format", { length: 10 }).$type<"pdf" | "csv" | "xlsx">().notNull(),
    parameters: varchar("parameters", { length: 2000 }), // JSON string for report parameters
    generatedBy: varchar("generated_by", { length: 255 })
        .notNull()
        .references(() => user.id),
    createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});
