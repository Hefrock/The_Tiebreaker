import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Analysis
  app.post("/api/analyze", async (req, res) => {
    const { decision, analysisType, provider } = req.body;
    const openaiKey = req.headers["x-openai-key"] as string;
    const claudeKey = req.headers["x-claude-key"] as string;

    if (!decision || !analysisType || !provider) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      let model;
      if (provider === "gemini") {
        /**
         * NOTE: Gemini uses the built-in GEMINI_API_KEY from the environment.
         * In certain environments (like some iframes or restricted proxies),
         * this built-in key may not work correctly if the model is not 
         * properly provisioned for the specific project ID.
         */
        model = google("gemini-1.5-pro-latest");
      } else if (provider === "openai") {
        const key = openaiKey || process.env.OPENAI_API_KEY;
        if (!key) throw new Error("OpenAI API Key is missing. Please provide it in settings.");
        const customOpenAI = createOpenAI({ apiKey: key });
        model = customOpenAI("gpt-4o");
      } else if (provider === "claude") {
        const key = claudeKey || process.env.ANTHROPIC_API_KEY;
        if (!key) throw new Error("Anthropic API Key is missing. Please provide it in settings.");
        const customAnthropic = createAnthropic({ apiKey: key });
        model = customAnthropic("claude-3-5-sonnet-20240620");
      } else {
        throw new Error("Invalid provider");
      }

      let systemInstruction = "You are a professional decision-making assistant. Provide clear, structured analysis using Markdown.";
      let prompt = "";

      if (analysisType === 'pros-cons') {
        prompt = `Analyze the following decision and provide a detailed list of pros and cons: "${decision}". 
        
        Format the output using Markdown with these specific requirements:
        1. Use "## ✅ Pros" and "## ❌ Cons" as main headers.
        2. Use bullet points for each item.
        3. **Bold** key terms or phrases at the start of each bullet point.
        4. Add a "## 💡 Summary & Verdict" section at the end with a clear recommendation.
        5. Use a professional yet supportive tone.`;
      } else if (analysisType === 'comparison') {
        prompt = `Analyze the following decision/options and provide a comparison table: "${decision}". 
        
        Format the output using Markdown with these specific requirements:
        1. Start with a brief "## 📋 Overview" of the options being compared.
        2. Provide a "## 📊 Comparison Table".
        3. **CRITICAL**: Keep cell content concise. For multiple points, use the bullet character "•" at the start of each line.
        4. **CRITICAL**: DO NOT use HTML tags (like <ul>, <li>, <br>) within the table.
        5. **CRITICAL**: Ensure the table is formatted as a standard Markdown table (pipes and hyphens).
        6. **CRITICAL**: Put a blank line before and after the table to ensure correct rendering.
        7. Ensure the first column is "Criteria" or "Feature".
        8. Use a "## 🏆 Recommendation" section at the end.`;
      } else if (analysisType === 'swot') {
        prompt = `Perform a SWOT analysis for the following decision/situation: "${decision}". 
        
        Format the output using Markdown with these specific requirements:
        1. Use "## 💪 Strengths", "## ⚠️ Weaknesses", "## 🌟 Opportunities", and "## 🎯 Threats" as headers.
        2. Under each header, provide 3-5 concise bullet points.
        3. Add a "## 🚀 Strategic Advice" section at the end that synthesizes the SWOT into actionable steps.
        4. Use bolding for emphasis.`;
      }

      const { text } = await generateText({
        model,
        system: systemInstruction,
        prompt: prompt,
      });

      res.json({ text });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate analysis" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
