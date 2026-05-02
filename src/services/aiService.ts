import { AnalysisType, AIProvider, APIKeys } from "../types";

export async function generateAnalysis(
  decision: string, 
  analysisType: AnalysisType, 
  provider: AIProvider,
  keys?: APIKeys
) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-openai-key": keys?.openai || "",
      "x-claude-key": keys?.claude || "",
    },
    body: JSON.stringify({ decision, analysisType, provider }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate analysis");
  }

  const data = await response.json();
  return data.text;
}
