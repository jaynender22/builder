import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// The client will pick up:
// - GOOGLE_APPLICATION_CREDENTIALS (service account JSON)
// - GOOGLE_CLOUD_PROJECT
// - GOOGLE_CLOUD_LOCATION
// - GOOGLE_GENAI_USE_VERTEXAI=True
const client = new GoogleGenAI({});

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

    // Call Gemini via Vertex (model name is the short name here)
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: combinedPrompt,
    });

    // In the Gen AI SDK, response.text is a convenient string accessor
    const suggestion =
      (response as any).text?.trim?.() || (response as any).text || blockText;

    return NextResponse.json({ suggestedText: suggestion });
  } catch (err) {
    console.error("Error in /api/ai-edit-block:", err);
    return NextResponse.json(
      { error: "Server error calling Vertex / Gemini" },
      { status: 500 }
    );
  }
}
