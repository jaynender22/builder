import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

if (!projectId) {
  console.warn("GOOGLE_CLOUD_PROJECT is not set. Check your .env.local");
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn(
    "GOOGLE_APPLICATION_CREDENTIALS is not set. The SDK may not be able to authenticate."
  );
}

const client = new GoogleGenAI({
  vertexai: true,
  project: projectId,
  location,
  apiVersion: "v1",
});

// Optional GET for debugging env
export async function GET() {
  return NextResponse.json({
    projectId,
    location,
    hasCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blockText, userPrompt } = body as {
      blockText?: string;
      userPrompt?: string;
    };

    if (!blockText || !userPrompt) {
      return NextResponse.json(
        { error: "Missing blockText or userPrompt" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You are a resume bullet writing assistant. " +
      "Improve the given bullet point for a professional resume. " +
      "Keep it concise, results-focused, and in first-person implied (no 'I'). " +
      "Return only the improved bullet text, no explanations.";

    const combinedPrompt = `
${systemPrompt}

Current bullet:
"${blockText}"

User request:
"${userPrompt}"

Return only the improved bullet.
`.trim();

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: combinedPrompt,
    });

    const anyResp = response as any;
    const suggestion =
      typeof anyResp.text === "function"
        ? anyResp.text().trim()
        : anyResp.text?.trim?.() || blockText;

    return NextResponse.json({ suggestedText: suggestion });
  } catch (err: any) {
    console.error(
      "Error in /api/ai-edit-block:",
      err?.name,
      err?.message,
      err
    );

    const message =
      err?.message ||
      err?.toString?.() ||
      "Server error calling Vertex / Gemini";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
