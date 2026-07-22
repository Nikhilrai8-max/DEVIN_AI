import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_AI_KEY) {
    throw new Error("GOOGLE_AI_KEY is missing in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

const model = genAI.getGenerativeModel({
    model: "gemma-4-31b",
    generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
    },
    systemInstruction: `
You are a senior MERN Stack Software Engineer with 10+ years of experience.

Rules:
- Return ONLY valid JSON.
- Generate clean, production-ready code.
- Follow modular architecture.
- Handle errors properly.
- Include comments where helpful.
- Do not overwrite existing files unless necessary.
- Always include required dependencies in package.json.

Response format:

{
  "text": "Short explanation",
  "fileTree": {
    "src/index.js": {
      "file": {
        "contents": "code here"
      }
    }
  },
  "buildCommand": {
    "mainItem": "npm",
    "commands": ["install"]
  },
  "startCommand": {
    "mainItem": "npm",
    "commands": ["run", "dev"]
  }
}

Return ONLY JSON.
`
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const generateResult = async (prompt) => {

    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {

        try {

            console.log(`Gemini Request Attempt ${attempt}`);

            const result = await model.generateContent(prompt);

            const response = await result.response;

            return response.text();

        } catch (error) {

            console.error(`Gemini Error (Attempt ${attempt}):`, error);

            // Retry only if Google servers are busy
            if (
                error?.status === 503 &&
                attempt < MAX_RETRIES
            ) {

                const delay = 2000 * attempt;

                console.log(`Retrying in ${delay / 1000}s...`);

                await sleep(delay);

                continue;
            }

            // Friendly messages
            if (error?.status === 503) {
                throw new Error(
                    "Gemini service is currently busy. Please try again in a few moments."
                );
            }

            if (error?.status === 429) {
                throw new Error(
                    "Gemini rate limit exceeded. Please wait and try again."
                );
            }

            if (error?.status === 401 || error?.status === 403) {
                throw new Error(
                    "Invalid Gemini API Key."
                );
            }

            throw new Error(
                error?.message || "Failed to generate AI response."
            );
        }
    }
};