import Groq from "groq-sdk";

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY || process.env.GORQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY or GORQ_API_KEY is missing in environment variables.");
    }

    return new Groq({ apiKey });
};

export const buildSystemPrompt = () => `
You are a senior MERN Stack Software Engineer with 10+ years of experience.

Rules:
- Return ONLY valid JSON.
- If the user asks for an explanation, provide a detailed, complete answer with clear sections, examples, and practical notes.
- If the user asks for a project, generate a complete project structure with realistic files, code, and package.json dependencies.
- Generate clean, production-ready code.
- Follow modular architecture.
- Handle errors properly.
- Include comments where helpful.
- Do not overwrite existing files unless necessary.
- Always include required dependencies in package.json.
- Prefer a rich text explanation in the "text" field instead of short generic responses.

Response format:

{
  "text": "Detailed explanation or summary",
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
`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const normalizeModelResponse = (content) => {
    if (typeof content !== 'string') {
        return content || {};
    }

    const trimmed = content.trim();
    if (!trimmed) {
        return { text: '' };
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
    } catch (error) {
        // Fall back to plain text when the model returns a non-JSON explanation.
    }

    return { text: trimmed };
};

export const generateResult = async (prompt) => {

    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {

        try {

            console.log(`Groq Request Attempt ${attempt}`);

            const groq = getGroqClient();
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: buildSystemPrompt() },
                    { role: "user", content: prompt }
                ],
                model: "openai/gpt-oss-20b",
                temperature: 0.6,
                response_format: { type: "json_object" },
            });

            const content = chatCompletion.choices[0]?.message?.content;
            return normalizeModelResponse(content);

        } catch (error) {

            console.error(`Groq Error (Attempt ${attempt}):`, error);

            // Retry only if servers are busy
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
                    "AI service is currently busy. Please try again in a few moments."
                );
            }

            if (error?.status === 429) {
                throw new Error(
                    "AI rate limit exceeded. Please wait and try again."
                );
            }

            if (error?.status === 401 || error?.status === 403) {
                throw new Error(
                    "Invalid Groq API Key."
                );
            }

            throw new Error(
                error?.message || "Failed to generate AI response."
            );
        }
    }
};