import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Read file into a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use pdf-parse v2 API
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text || "";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Error parsing PDF:", err);
    return NextResponse.json(
      { error: "Server error while parsing PDF" },
      { status: 500 }
    );
  }
}
