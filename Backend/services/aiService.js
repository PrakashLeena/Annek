const OpenAI = require("openai");
const {
  normalizeSpec,
  validateSpec,
  validateAiResponse,
} = require("./websiteSchema");
const { buildGenerateMessages, buildUpdateMessages, STATUS_STAGES } = require("./promptBuilder");
const { applyChanges } = require("./specPatcher");

const MODEL = "z-ai/glm-5.2";
const MAX_PROMPT_LENGTH = 8000;
const REQUEST_TIMEOUT_MS = 120000;

let client = null;

function getClient() {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured.");
  }
  if (!client) {
    client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }
  return client;
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
      try {
        return JSON.parse(fence[1].trim());
      } catch {
        /* continue */
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callModel(messages, onStatus) {
  const openai = getClient();
  let fullContent = "";

  for (let i = 0; i < STATUS_STAGES.length - 1; i++) {
    onStatus?.(STATUS_STAGES[i]);
    await new Promise((r) => setTimeout(r, 350));
  }
  onStatus?.(STATUS_STAGES[STATUS_STAGES.length - 2]);

  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 1,
    top_p: 1,
    max_tokens: 16384,
    seed: 42,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || "";
    fullContent += delta;
  }

  onStatus?.(STATUS_STAGES[STATUS_STAGES.length - 1]);
  return fullContent;
}

function processAiResult(parsed, existingSpec = null) {
  const responseValidation = validateAiResponse(parsed);
  if (!responseValidation.valid) {
    throw new Error("Invalid AI response format.");
  }

  if (parsed.action === "create_website") {
    const spec = normalizeSpec(parsed.spec);
    const specValidation = validateSpec(spec);
    if (!specValidation.valid) {
      throw new Error("Generated website failed validation.");
    }
    return {
      action: "create_website",
      message: parsed.message || "Your website has been generated.",
      spec,
    };
  }

  if (!existingSpec) {
    throw new Error("Cannot update without an existing website.");
  }

  const updated = applyChanges(existingSpec, parsed.changes);
  const specValidation = validateSpec(updated);
  if (!specValidation.valid) {
    throw new Error("Updated website failed validation.");
  }

  return {
    action: "update_website",
    message: parsed.message || "Your website has been updated.",
    spec: updated,
    changes: parsed.changes,
  };
}

async function generateWebsite(prompt, { onStatus } = {}) {
  const cleaned = String(prompt || "").trim();
  if (!cleaned) throw new Error("Please describe the website you want to build.");
  if (cleaned.length > MAX_PROMPT_LENGTH) {
    throw new Error("Your prompt is too long. Please shorten it and try again.");
  }

  const content = await callModel(buildGenerateMessages(cleaned), onStatus);
  const parsed = extractJson(content);
  if (!parsed) throw new Error("AI returned an invalid response. Please try again.");
  return processAiResult(parsed);
}

async function updateWebsite(userMessage, existingSpec, context, { onStatus } = {}) {
  const cleaned = String(userMessage || "").trim();
  if (!cleaned) throw new Error("Please describe what you'd like to change.");
  if (cleaned.length > MAX_PROMPT_LENGTH) {
    throw new Error("Your message is too long. Please shorten it and try again.");
  }
  if (!existingSpec) throw new Error("No website to update. Generate one first.");

  const content = await callModel(
    buildUpdateMessages(cleaned, context || existingSpec),
    onStatus
  );
  const parsed = extractJson(content);
  if (!parsed) throw new Error("AI returned an invalid response. Please try again.");
  return processAiResult(parsed, existingSpec);
}

function mapApiError(err) {
  const msg = err?.message || "";
  if (msg.includes("NVIDIA_API_KEY")) return "AI service is not configured. Please contact support.";
  if (err?.status === 429 || msg.toLowerCase().includes("rate")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
    return "The request timed out. Please try again.";
  }
  if (msg.includes("Please ") || msg.includes("Cannot ") || msg.includes("No website")) {
    return msg;
  }
  return "Sorry, I couldn't generate your website right now. Please try again.";
}

module.exports = {
  generateWebsite,
  updateWebsite,
  extractJson,
  processAiResult,
  mapApiError,
  MAX_PROMPT_LENGTH,
};
