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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);
    const text = data.text || "";

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
