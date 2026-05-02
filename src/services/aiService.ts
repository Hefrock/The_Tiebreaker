import { AnalysisType, AIProvider, APIKeys } from "../types";
import { GoogleGenAI } from "@google/genai";

const getPrompt = (decision: string, analysisType: AnalysisType) => {
  if (analysisType === 'pros-cons') {
    return `Analyze the following decision and provide a detailed list of pros and cons: "${decision}". 
    
    Format the output using Markdown with these specific requirements:
    1. Use "## ✅ Pros" and "## ❌ Cons" as main headers.
    2. Use bullet points for each item.
    3. **Bold** key terms or phrases at the start of each bullet point.
    4. Add a "## 💡 Summary & Verdict" section at the end with a clear recommendation.
    5. Use a professional yet supportive tone.`;
  } else if (analysisType === 'comparison') {
    return `Analyze the following decision/options and provide a comparison table: "${decision}". 
    
    Format the output using Markdown with these specific requirements:
    1. Start with a brief "## 📋 Overview" of the options being compared.
    2. Provide a "## 📊 Comparison Table".
    3. **CRITICAL**: Keep cell content concise. For multiple points, use the bullet character "•" at the start of each line.
    4. **CRITICAL**: DO NOT use HTML tags (like <ul>, <li>, <br>) within the table.
    5. **CRITICAL**: Ensure the table is formatted as a standard Markdown table (pipes and hyphens).
    6. **CRITICAL**: Put a blank line before and after the table to ensure correct rendering.
    7. Ensure the first column is "Criteria" or "Feature".
    8. Use a "## 🏆 Recommendation" section at the end.`;
  } else {
    // swot
    return `Perform a SWOT analysis for the following decision/situation: "${decision}". 
    
    Format the output using Markdown with these specific requirements:
    1. Use "## 💪 Strengths", "## ⚠️ Weaknesses", "## 🌟 Opportunities", and "## 🎯 Threats" as headers.
    2. Under each header, provide 3-5 concise bullet points.
    3. Add a "## 🚀 Strategic Advice" section at the end that synthesizes the SWOT into actionable steps.
    4. Use bolding for emphasis.`;
  }
};

export async function generateAnalysis(
  decision: string, 
  analysisType: AnalysisType, 
  provider: AIProvider,
  keys?: APIKeys
) {
  // Use frontend Gemini call for AI Studio as recommended in skills
  if (provider === 'gemini') {
    try {
      // In AI Studio, GEMINI_API_KEY is automatically available to the frontend process.env
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please ensure it is correctly set in your AI Studio project settings.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = getPrompt(decision, analysisType);
      const systemInstruction = "You are a professional decision-making assistant. Provide clear, structured analysis using Markdown.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      
      if (!response.text) {
        throw new Error("No response received from Gemini.");
      }
      
      return response.text;
    } catch (error: any) {
      console.error("Gemini Frontend Error:", error);
      throw new Error(`Gemini Error: ${error.message || 'Unknown error. Check console for details.'}`);
    }
  }

  // Proxy other providers through backend
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
