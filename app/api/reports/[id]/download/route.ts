import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studyReports } from "@/db/schema/studies";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reportId } = await params;

    // Find the report and verify ownership
    const report = await db
      .select()
      .from(studyReports)
      .where(and(
        eq(studyReports.id, reportId),
        eq(studyReports.generatedBy, session.user.id)
      ))
      .limit(1);

    if (report.length === 0) {
      return NextResponse.json(
        { error: "Report not found or access denied" },
        { status: 404 }
      );
    }

    // For demo purposes, create a mock PDF content
    const pdfContent = generateMockPDF(report[0]);

    return new Response(pdfContent as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report[0].fileName}"`,
      },
    });

  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}

function generateMockPDF(report: any): Buffer {
  // This is a mock PDF content - in a real application, you would use a PDF generation library
  const mockPDFContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
100 700 Td
(ZeroWare Report: ${report.fileName}) Tj
0 -20 Td
(Generated: ${report.createdAt}) Tj
0 -20 Td
(Report Type: ${report.reportType}) Tj
0 -40 Td
(This is a mock PDF report.) Tj
0 -20 Td
(In a real implementation, this would contain) Tj
0 -20 Td
(detailed analytics and charts.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000246 00000 n 
0000000317 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
567
%%EOF`;

  return Buffer.from(mockPDFContent);
}
