const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["projects"],
  properties: {
    projects: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "context",
          "role",
          "actions",
          "techStack",
          "challenges",
          "outcomes",
          "metrics",
          "bullets"
        ],
        properties: {
          title: { type: "string" },
          context: { type: "string" },
          role: { type: "string" },
          actions: { type: "array", items: { type: "string" } },
          techStack: { type: "array", items: { type: "string" } },
          challenges: { type: "array", items: { type: "string" } },
          outcomes: { type: "array", items: { type: "string" } },
          metrics: { type: "array", items: { type: "string" } },
          bullets: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: { type: "string" }
          }
        }
      }
    }
  }
};

export function buildOpenAIRequest({ model, sources }) {
  return {
    model,
    instructions:
      "You are a resume extraction assistant. Extract project experience from messy workplace documents. Return Chinese content suitable for big-tech resumes. Do not invent metrics; use editable placeholders when metrics are missing.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildSourcePrompt(sources)
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "resume_projects",
        strict: true,
        schema: RESPONSE_SCHEMA
      }
    }
  };
}

export async function extractWithOpenAI({ apiKey, model, sources, fetchImpl = fetch }) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in this PowerShell session.");
  }

  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(buildOpenAIRequest({ model, sources }))
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message ?? `OpenAI request failed with ${response.status}`;
    throw new Error(message);
  }

  const text = extractOutputText(payload);
  return normalizeProjects(JSON.parse(text));
}

export function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

export function normalizeProjects(payload) {
  return payload.projects.map((project) => ({
    id: createId("project"),
    title: project.title,
    context: project.context,
    role: project.role,
    actions: project.actions,
    techStack: project.techStack,
    challenges: project.challenges,
    outcomes: project.outcomes,
    metrics: project.metrics,
    bullets: project.bullets.map((text) => ({
      id: createId("bullet"),
      text,
      needsMetric: /XX|待补充|待量化/.test(text)
    }))
  }));
}

function buildSourcePrompt(sources) {
  return sources
    .filter((source) => source.status === "ready")
    .map(
      (source) => `# Source: ${source.name}\nType: ${source.type}\n\n${source.text.trim()}`
    )
    .join("\n\n---\n\n");
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
