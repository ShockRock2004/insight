import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// 1. Middleware: Allow frontend to talk to this backend
app.use(cors());
app.use(express.json());

// 2. Configuration
// ⚠️ In production, use process.env.GEMINI_API_KEY. For this task, we use it directly.
const GEMINI_API_KEY = "AIzaSyAfSkRnHS5fIprTiIOJEpSOIAXffGKXUUY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// 3. The Analyze Endpoint
app.post('/analyze', async (req, res) => {
    try {
        const { journals } = req.body;

        if (!journals || journals.trim().length === 0) {
            return res.status(400).json({ error: "No journal content provided." });
        }

        console.log("📝 Received analysis request. Calling Gemini...");

        // Call Google Gemini API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: journals }]
                }]
            })
        });

        const data = await response.json();

        // Defensive Parsing: Don't crash if Gemini returns weird structure
        if (data.error) {
            throw new Error(data.error.message || "Gemini API Error");
        }

        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            throw new Error("AI returned no text content.");
        }

        // Send success response
        res.json({ result: aiText });

    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: "AI Service Unavailable: " + error.message });
    }
});

// 4. Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Backend running at http://localhost:${PORT}`);
    console.log(`✨ Ready to analyze journals.\n`);
});