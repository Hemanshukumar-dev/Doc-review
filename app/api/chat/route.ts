import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { pdfText, action } = (await req.json()) as {
      pdfText: string;
      action: "summarize" | "extractTags";
    };

    if (!pdfText) {
      return new Response("No PDF text provided", { status: 400 });
    }

    if (!action || !["summarize", "extractTags"].includes(action)) {
      return new Response("Invalid action", { status: 400 });
    }

    const prompts = {
      summarize: `
        Provide a professional executive summary in Markdown format.
        Structure the response as follows:
        ## Executive Summary
        (A brief overview paragraph)

        ## Key Insights
        (Bullet points with bold headers for key concepts)

        ## Conclusion
        (A final wrap-up statement)
      `,
      extractTags: `
        Extract key topics and entities as hashtags or keywords.
        Return them as a comma-separated list.
      `,

    };

    const systemInstruction =
      "You are a professional document analysis AI. format your responses in clean, structured Markdown. Use bold for emphasis, lists for readability, and clear headings.";

    const result = streamText({
      model: google("models/gemini-2.5-flash"),
      system: systemInstruction,
      prompt: `${
        prompts[action as keyof typeof prompts]
      }\n\nDocument Content:\n${pdfText}`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
