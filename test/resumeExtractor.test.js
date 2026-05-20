import test from "node:test";
import assert from "node:assert/strict";
import {
  extractProjects,
  updateBulletText,
  validateSources
} from "../src/resumeExtractor.js";

test("validateSources rejects short or empty source text", () => {
  const result = validateSources([
    { id: "s1", name: "notes.txt", type: "txt", text: "太短", status: "ready" }
  ]);

  assert.equal(result.ok, false);
  assert.match(result.error, /至少/);
});

test("extractProjects creates a structured project with editable resume bullets", async () => {
  const projects = await extractProjects({
    sources: [
      {
        id: "s1",
        name: "growth-platform.md",
        type: "md",
        status: "ready",
        text:
          "项目：增长平台重构。背景：投放链路分散，数据看板延迟。我的工作：搭建统一活动配置，优化埋点口径，推动运营和研发对齐。结果：配置效率提升，支持多个业务线复用。技术：React、Node、数据看板。"
      }
    ],
    language: "zh-CN",
    style: "big-tech"
  });

  assert.equal(projects.length, 1);
  assert.equal(projects[0].title, "增长平台重构");
  assert.ok(projects[0].context.length > 0);
  assert.ok(projects[0].actions.length >= 2);
  assert.ok(projects[0].techStack.includes("React"));
  assert.equal(projects[0].bullets.length, 4);
  assert.ok(projects[0].bullets.every((bullet) => bullet.text.length > 10));
});

test("updateBulletText changes one bullet without mutating the original project", async () => {
  const [project] = await extractProjects({
    sources: [
      {
        id: "s1",
        name: "weekly.txt",
        type: "txt",
        status: "ready",
        text:
          "项目：简历助手。背景：项目资料分散。我的工作：整理资料、生成项目卡、优化简历 bullet。结果：减少手动整理时间。技术：JavaScript、前端工程。"
      }
    ],
    language: "zh-CN",
    style: "big-tech"
  });

  const updated = updateBulletText(project, project.bullets[0].id, "新的 bullet 文案");

  assert.equal(updated.bullets[0].text, "新的 bullet 文案");
  assert.notEqual(project.bullets[0].text, "新的 bullet 文案");
});
