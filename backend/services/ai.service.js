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
- Return ONLY valid, complete JSON. Never return partial or truncated JSON.
- KEEP RESPONSES CONCISE. Generate minimal but functional code.
- For projects: create a SIMPLE, single-tier structure. Use only essential files (no separate client/server folders unless explicitly asked).
- Limit file count to 5-8 files maximum.
- Use short variable names and minimal comments.
- Do not generate test files, CI configs, or Docker files unless asked.
- Always include required dependencies in package.json.
- If the user asks a simple question, return ONLY a text response with no fileTree.

Response format:

{
  "text": "Brief explanation",
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
    "commands": ["start"]
  }
}

IMPORTANT: Keep total response under 4000 tokens. Return ONLY valid JSON.
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

            // On JSON validation failure retries, drop the strict response_format
            const useStrictJson = attempt === 1;

            const requestParams = {
                messages: [
                    { role: "system", content: buildSystemPrompt() },
                    { role: "user", content: prompt }
                ],
                model: "openai/gpt-oss-120b",
                temperature: 0.6,
                max_tokens: 16384,
            };

            if (useStrictJson) {
                requestParams.response_format = { type: "json_object" };
            }

            const chatCompletion = await groq.chat.completions.create(requestParams);

            const content = chatCompletion.choices[0]?.message?.content;
            return normalizeModelResponse(content);

        } catch (error) {

            console.error(`Groq Error (Attempt ${attempt}):`, error);

            // Retry on JSON validation failure (drop strict JSON mode on next attempt)
            if (
                error?.status === 400 &&
                error?.error?.error?.code === 'json_validate_failed' &&
                attempt < MAX_RETRIES
            ) {
                console.log(`JSON validation failed, retrying without strict JSON mode...`);
                await sleep(1000);
                continue;
            }

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