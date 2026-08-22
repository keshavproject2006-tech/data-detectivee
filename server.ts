import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Validate Gemini API Key and handle lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will fallback to stub/educational answers.");
      // Create a dummy client to avoid crashing on load, we'll handle calls gracefully
      aiClient = new GoogleGenAI({
        apiKey: "DUMMY_KEY",
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    } else {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request bodies up to 10MB
  app.use(express.json({ limit: "10mb" }));

  // API: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API: Analyze Dataset
  app.post("/api/analyze-dataset", async (req, res) => {
    try {
      const { fileName, rowCount, columnCount, columns, rawSample, hasBeenCleaned } = req.body;

      if (!fileName || !columns) {
        return res.status(400).json({ error: "Missing required fields: fileName and columns structure are required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(200).json({
          warning: "API_KEY_MISSING",
          aiSummary: {
            plainEnglishExplanation: "The dataset contains " + rowCount + " rows and " + columnCount + " columns. This is a local analysis. Please provide a valid GEMINI_API_KEY in the Secrets / Env config to unlock full AI summaries.",
            executiveSummary: "Local Analysis Summary: Standard statistics parsed successfully. To enable comprehensive AI Insights, please configure your Gemini API Key.",
            keyFindings: ["Row count: " + rowCount, "Column count: " + columnCount, "Dataset processed as " + fileName],
            correlations: ["Numeric correlation requires active Gemini AI processing."],
            trends: ["Timeline trends require active Gemini AI forecasting."],
            businessInsights: ["Recommendations requires active Gemini AI analysis."],
            riskAnalysis: ["Outlier risks require active Gemini AI scanning."],
            recommendations: ["Ensure columns with missing data are filled or handled in data cleaning.", "Deploy Gemini API Key to activate automatic SaaS business advice."],
            suggestedKPIs: ["Data Quality Index", "Record Count Velocity"],
            mlModels: ["Linear Regression", "Isolation Forest"],
            featureImportance: ["Column data patterns"],
            storytelling: "We processed your data successfully in the local workspace. Please link a Gemini API key to tell a full corporate story.",
            confidenceScore: 70,
            dashboardTitle: "Local " + fileName + " Dashboard",
            datasetDescription: "Dataset of " + rowCount + " records loaded from " + fileName + "."
          },
          anomalies: [
            { rowIndex: 0, columnName: columns[0]?.name || "N/A", value: "Sample", reason: "AI API Key missing. This is a placeholder anomaly.", severity: "low" }
          ],
          predictions: [
            {
              targetColumn: columns.find((c: any) => c.type === 'numeric')?.name || "Metrics",
              forecast: [
                { label: "Month 1", value: 100, confidenceMin: 90, confidenceMax: 110 },
                { label: "Month 2", value: 115, confidenceMin: 100, confidenceMax: 130 },
                { label: "Month 3", value: 130, confidenceMin: 110, confidenceMax: 150 }
              ],
              explanation: "Provide a Gemini API Key to unlock real statistical predictive forecasts based on advanced models.",
              confidenceScore: 50
            }
          ]
        });
      }

      const ai = getGeminiClient();

      const prompt = `You are an expert Chief Data Scientist and Enterprise Business Analyst.
Analyze this dataset structure and sample records, then generate high-quality, professional insights, anomaly detection list, and time-series predictions.

Dataset Details:
- File Name: ${fileName}
- Row Count: ${rowCount}
- Column Count: ${columnCount}
- State: ${hasBeenCleaned ? "Cleaned" : "Raw"}
- Columns: ${JSON.stringify(columns)}
- Sample Data Rows: ${JSON.stringify(rawSample)}

Generate a response adhering to the following JSON structure exactly. Ensure no markdown formatting is wrapped around the JSON (just return raw JSON or JSON in codeblocks. We prefer pure JSON).

Expected Output JSON structure:
{
  "plainEnglishExplanation": "A 2-3 sentence overview explaining what this dataset is about in extremely clear, simple terms.",
  "executiveSummary": "A robust 3-4 sentence summary of the strategic and commercial value found in this dataset.",
  "keyFindings": ["3 to 5 key interesting findings from the data statistics"],
  "correlations": ["2 to 4 observations about how different columns correlate, or are independent"],
  "trends": ["2 to 4 observations of trends or timeline insights"],
  "businessInsights": ["3 to 4 business insights tailored to the dataset topic"],
  "riskAnalysis": ["2 to 3 risks identified (e.g. data quality issues, highly volatile columns, dependency risks)"],
  "recommendations": ["3 to 4 specific, actionable recommendations for business decision makers based on findings"],
  "suggestedKPIs": ["3 to 4 key performance indicators (KPIs) to track based on this data"],
  "mlModels": ["2 to 3 machine learning models suitable for predicting or classifying data in this dataset (e.g., Random Forest, XGBoost)"],
  "featureImportance": ["3 suggested feature engineering columns or which column is likely the most important driver"],
  "storytelling": "A highly compelling, creative paragraph telling the 'story' of this dataset, starting with where it comes from and where it is going.",
  "confidenceScore": 85, // An integer between 1 and 100 representing the data reliability/analytical readiness
  "dashboardTitle": "An elegant, creative title for the dashboard dashboard (e.g., 'Customer Retention & Lifetime Value Hub')",
  "datasetDescription": "A concise description (1-2 sentences) of the dataset.",
  "anomalies": [
    {
      "rowIndex": 0, // Suggest an index of a potential anomaly or outlier based on the sample or general description
      "columnName": "Name of column with outlier/anomaly",
      "value": "An example outlier value",
      "reason": "Why this is an anomaly or outlier (e.g. 3 standard deviations away from mean, suspicious pattern, missing values)",
      "severity": "high" // or "medium" or "low"
    }
  ],
  "predictions": [
    {
      "targetColumn": "The name of a numeric column that makes sense to predict/forecast",
      "forecast": [
        { "label": "Forecast 1", "value": 150, "confidenceMin": 130, "confidenceMax": 170 },
        { "label": "Forecast 2", "value": 180, "confidenceMin": 150, "confidenceMax": 210 },
        { "label": "Forecast 3", "value": 220, "confidenceMin": 180, "confidenceMax": 260 }
      ],
      "explanation": "Why this numeric target is forecast this way based on trends in the data.",
      "confidenceScore": 80 // Integer 1-100
    }
  ]
}`;

      // Call Gemini 3.5 Flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const cleanJsonStr = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const analysisResult = JSON.parse(cleanJsonStr);

      res.json(analysisResult);
    } catch (error: any) {
      console.error("Error in analyze-dataset:", error);
      res.status(500).json({ error: "Failed to generate AI insights.", details: error.message });
    }
  });

  // API: Chat about dataset
  app.post("/api/chat", async (req, res) => {
    try {
      const { datasetInfo, chatHistory, newMessage } = req.body;

      if (!newMessage) {
        return res.status(400).json({ error: "Missing required field: newMessage." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.json({
          response: "AI API Key is missing. I can see you have loaded a dataset with " + (datasetInfo?.rowCount || 0) + " rows. To converse with me about your columns, anomalies, and future predictions, please add a valid `GEMINI_API_KEY` in the AI Studio Secrets panel."
        });
      }

      const ai = getGeminiClient();

      // Format previous chat history for the prompt
      const formattedHistory = (chatHistory || []).map((msg: any) => {
        return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
      }).join("\n");

      const prompt = `You are "AI Data Detective", a brilliant conversational data analyst assistant. 
You are helping a user explore, query, and unlock business value from their dataset.

Dataset Background Information:
${JSON.stringify(datasetInfo, null, 2)}

Previous Conversation:
${formattedHistory}

User's New Question:
"${newMessage}"

Provide a comprehensive, high-quality, professional, yet easy-to-understand response. 
- If the user asks for specific values or mathematical analysis, refer to the provided dataset background metadata, schema, and sample rows.
- If they ask for advice on what to clean next, give specific column suggestions.
- If they ask for predictive forecasts, outline an explanation clearly.
- Keep your tone sharp, helpful, and executive-level. Limit response to 3-4 dense paragraphs or formatted lists. Use markdown formatting beautifully (bolding, lists, tables if needed).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      res.json({ response: response.text || "I was unable to analyze that query." });
    } catch (error: any) {
      console.error("Error in dataset chat:", error);
      res.status(500).json({ error: "Failed to run AI Chat.", details: error.message });
    }
  });

  // Vite middleware / client static serving
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
    console.log(`AI Data Detective backend server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
