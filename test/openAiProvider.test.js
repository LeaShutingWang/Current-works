import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOpenAIRequest,
  extractOutputText,
  normalizeProjects
} from "../src/openAiProvider.js";

test("buildOpenAIRequest creates a structured Responses API request", () => {
  const body = buildOpenAIRequest({
    model: "gpt-test",
    sources: [
      {
        id: "s1",
        name: "weekly.md",
        type: "md",
        text: "项目：增长平台。背景：配置分散。我的工作：搭建统一配置。结果：效率提升。",
        status: "ready"
      }
    ]
  });

  assert.equal(body.model, "gpt-test");
  assert.match(body.instructions, /resume extraction/i);
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.text.format.name, "resume_projects");
  assert.equal(body.text.format.strict, true);
  assert.match(JSON.stringify(body.input), /weekly\.md/);
});

test("extractOutputText reads text from Responses API output blocks", () => {
  const text = extractOutputText({
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: "{\"projects\":[]}" }]
      }
    ]
  });

  assert.equal(text, "{\"projects\":[]}");
});

test("normalizeProjects assigns ids and bullet metadata", () => {
  const projects = normalizeProjects({
    projects: [
      {
        title: "增长平台",
        context: "配置分散",
        role: "核心推动",
        actions: ["搭建统一配置"],
        techStack: ["React"],
        challenges: ["跨团队口径不一致"],
        outcomes: ["配置效率提升"],
        metrics: ["提升 XX%（待补充）"],
        bullets: ["搭建统一配置平台，提升 XX%（待补充）。"]
      }
    ]
  });

  assert.equal(projects.length, 1);
  assert.ok(projects[0].id.startsWith("project-"));
  assert.ok(projects[0].bullets[0].id.startsWith("bullet-"));
  assert.equal(projects[0].bullets[0].needsMetric, true);
});
