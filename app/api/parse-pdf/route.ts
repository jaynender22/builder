import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

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

    // pdf-parse v1 API
    const data = await pdf(buffer);
    const text = data.text || "";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Error parsing PDF:", err);
    return NextResponse.json(
      { error: err?.message || "Server error while parsing PDF" },
      { status: 500 }
    );
  }
}
