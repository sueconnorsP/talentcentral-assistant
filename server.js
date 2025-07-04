import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

// Load environment variables
dotenv.config();

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// API route to handle assistant conversation
app.post("/ask-talent", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.ASSISTANT_ID,
    });

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantReply = messages.data.find((msg) => msg.role === "assistant");

    res.json({
      response: assistantReply?.content[0]?.text?.value || "Hmm, I couldn’t find a good answer for that.",
    });
  } catch (err) {
    console.error("❌ Error during OpenAI call:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// Serve React static build
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`✅ TalentCentral Assistant server running on port ${port}`);
});
