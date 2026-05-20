const state = {
  sources: [],
  projects: [],
  isGenerating: false
};

const elements = {
  pasteInput: document.querySelector("#pasteInput"),
  fileInput: document.querySelector("#fileInput"),
  dropZone: document.querySelector("#dropZone"),
  sourceList: document.querySelector("#sourceList"),
  generateButton: document.querySelector("#generateButton"),
  inputHint: document.querySelector("#inputHint"),
  projectList: document.querySelector("#projectList"),
  projectEmpty: document.querySelector("#projectEmpty"),
  projectCount: document.querySelector("#projectCount"),
  bulletList: document.querySelector("#bulletList"),
  bulletEmpty: document.querySelector("#bulletEmpty"),
  appStatus: document.querySelector("#appStatus")
};

elements.pasteInput.addEventListener("input", () => {
  const text = elements.pasteInput.value.trim();
  const existing = state.sources.find((source) => source.type === "pasted");

  if (!text && existing) {
    state.sources = state.sources.filter((source) => source.type !== "pasted");
  } else if (text && existing) {
    existing.text = text;
  } else if (text) {
    state.sources.unshift({
      id: createId("source"),
      name: "粘贴内容",
      type: "pasted",
      text,
      status: "ready"
    });
  }

  renderSources();
});

elements.fileInput.addEventListener("change", async (event) => {
  await addFiles([...event.target.files]);
  elements.fileInput.value = "";
});

elements.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("dragging");
});

elements.dropZone.addEventListener("dragleave", () => {
  elements.dropZone.classList.remove("dragging");
});

elements.dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("dragging");
  await addFiles([...event.dataTransfer.files]);
});

elements.generateButton.addEventListener("click", async () => {
  const validation = validateSources(state.sources);
  if (!validation.ok) {
    showHint(validation.error, true);
    return;
  }

  state.isGenerating = true;
  renderControls();
  showHint("正在提炼项目经历...");

  try {
    const result = await extractFromActiveProvider();
    state.projects = result.projects;
    elements.appStatus.textContent =
      result.provider === "openai" ? `真实 AI：${result.model}` : "本地 mock 模式";
    showHint(
      result.provider === "openai"
        ? "已通过真实 OpenAI API 生成。你可以直接编辑右侧文案。"
        : "本地 mock 已生成。启动 server 并配置 OPENAI_API_KEY 后会自动调用真实 AI。"
    );
  } catch (error) {
    showHint(error.message, true);
  } finally {
    state.isGenerating = false;
    renderControls();
    renderProjects();
    renderBullets();
  }
});

async function extractFromActiveProvider() {
  try {
    const response = await fetch(resolveApiUrl("/api/extract"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sources: state.sources })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "真实 AI 请求失败。");
    }

    return await response.json();
  } catch {
    return {
      provider: "mock",
      model: "local",
      projects: await extractProjects({
        sources: state.sources,
        language: "zh-CN",
        style: "big-tech"
      })
    };
  }
}

async function refreshProviderStatus() {
  try {
    const response = await fetch(resolveApiUrl("/api/status"));
    const status = await response.json();
    elements.appStatus.textContent =
      status.mode === "openai" ? `真实 AI：${status.model}` : "未检测到 API Key";
  } catch {
    elements.appStatus.textContent = "本地 mock 模式";
  }
}

async function addFiles(files) {
  for (const file of files) {
    const extension = file.name.split(".").pop().toLowerCase();
    const source = {
      id: createId("source"),
      name: file.name,
      type: extension,
      text: "",
      status: "parsing"
    };

    state.sources.push(source);
    renderSources();

    if (!["txt", "md", "docx"].includes(extension)) {
      source.status = "error";
      source.error = "暂不支持这个文件格式，请使用 txt、md 或 docx。";
      renderSources();
      continue;
    }

    if (extension === "docx") {
      source.status = "error";
      source.error = "这个静态原型先展示 docx 占位状态；下一版接入解析库后可直接读取。";
      renderSources();
      continue;
    }

    try {
      source.text = await file.text();
      source.status = source.text.trim() ? "ready" : "error";
      source.error = source.status === "error" ? "文件内容为空。" : undefined;
    } catch {
      source.status = "error";
      source.error = "读取文件失败，可以改用粘贴文本。";
    }

    renderSources();
  }
}

function renderSources() {
  elements.sourceList.innerHTML = "";

  for (const source of state.sources) {
    const item = document.createElement("article");
    item.className = "source-item";
    item.innerHTML = `
      <div>
        <p class="source-title">${escapeHtml(source.name)}</p>
        <p class="source-meta">${sourceLabel(source)}</p>
      </div>
      <button class="icon-button" type="button" title="删除">删除</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      state.sources = state.sources.filter((entry) => entry.id !== source.id);
      if (source.type === "pasted") elements.pasteInput.value = "";
      renderSources();
    });

    elements.sourceList.append(item);
  }

  renderControls();
}

function renderProjects() {
  elements.projectList.innerHTML = "";
  elements.projectCount.textContent = `${state.projects.length} 个项目`;
  elements.projectEmpty.classList.toggle("hidden", state.projects.length > 0);

  for (const project of state.projects) {
    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `
      <h3>${escapeHtml(project.title)}</h3>
      <div class="fact-grid">
        ${fact("项目背景", project.context)}
        ${fact("我的角色", project.role)}
        ${factList("关键动作", project.actions)}
        ${factList("技术栈 / 方法", project.techStack)}
        ${factList("难点", project.challenges)}
        ${factList("结果", project.outcomes)}
        ${factList("指标", project.metrics)}
      </div>
    `;
    elements.projectList.append(card);
  }
}

function renderBullets() {
  elements.bulletList.innerHTML = "";
  elements.bulletEmpty.classList.toggle("hidden", state.projects.length > 0);

  for (const project of state.projects) {
    const card = document.createElement("article");
    card.className = "bullet-card";
    card.innerHTML = `
      <h3>${escapeHtml(project.title)}</h3>
      <button class="copy-button copy-all" type="button">复制整个项目</button>
      <div class="bullet-rows"></div>
    `;

    card.querySelector(".copy-all").addEventListener("click", () => {
      copyText(project.bullets.map((bullet) => `- ${bullet.text}`).join("\n"));
    });

    const rows = card.querySelector(".bullet-rows");
    for (const bullet of project.bullets) {
      const row = document.createElement("div");
      row.className = "bullet-row";
      row.innerHTML = `
        <div>
          <textarea>${escapeHtml(bullet.text)}</textarea>
          ${bullet.needsMetric ? '<span class="needs-metric">待补充指标</span>' : ""}
        </div>
        <button class="copy-button" type="button">复制</button>
      `;

      row.querySelector("textarea").addEventListener("input", (event) => {
        replaceProject(updateBulletText(project, bullet.id, event.target.value));
      });

      row.querySelector("button").addEventListener("click", () => {
        copyText(row.querySelector("textarea").value);
      });

      rows.append(row);
    }

    elements.bulletList.append(card);
  }
}

function replaceProject(nextProject) {
  state.projects = state.projects.map((project) =>
    project.id === nextProject.id ? nextProject : project
  );
}

function renderControls() {
  elements.generateButton.disabled = state.isGenerating;
}

function showHint(message, isError = false) {
  elements.inputHint.textContent = message;
  elements.inputHint.classList.toggle("error", isError);
}

function sourceLabel(source) {
  if (source.status === "ready") return `${source.type} · 已读取 · ${source.text.length} 字`;
  if (source.status === "parsing") return `${source.type} · 解析中`;
  return `${source.type} · ${source.error}`;
}

function fact(label, value) {
  return `
    <div class="fact">
      <strong>${label}</strong>
      <p>${escapeHtml(value)}</p>
    </div>
  `;
}

function factList(label, values) {
  return `
    <div class="fact">
      <strong>${label}</strong>
      <ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>
    </div>
  `;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    elements.appStatus.textContent = "已复制";
    setTimeout(() => {
      elements.appStatus.textContent = "本地 mock 模式";
    }, 1200);
  } catch {
    showHint("复制失败，可以手动选中文案复制。", true);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

renderSources();
renderProjects();
renderBullets();
refreshProviderStatus();

function resolveApiUrl(path) {
  if (location.protocol === "http:" || location.protocol === "https:") {
    return path;
  }
  return `http://127.0.0.1:8787${path}`;
}

function validateSources(sources) {
  const readyText = sources
    .filter((source) => source.status === "ready")
    .map((source) => source.text.trim())
    .join("\n\n");

  if (readyText.length < 40) {
    return {
      ok: false,
      error: "至少补充一些项目背景、目标、你做过的动作或结果，再提炼工作经历。"
    };
  }

  return { ok: true, text: readyText };
}

async function extractProjects(request) {
  const validation = validateSources(request.sources);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const text = validation.text;
  const title = extractTitle(text);
  const techStack = extractTechStack(text);
  const actions = extractActions(text);
  const metrics = extractMetrics(text);
  const outcomes = extractOutcomes(text);

  return [
    {
      id: createId("project"),
      title,
      context: extractSection(text, ["背景", "问题", "目标"], "资料显示该项目围绕业务效率、协作链路或系统能力建设展开。"),
      role: "核心执行 / 推动者（可按你的真实角色调整）",
      actions,
      techStack,
      challenges: [
        "资料分散、上下游信息不一致，需要把目标、动作和结果重新组织成可复用表达。",
        "业务价值和技术动作之间缺少显性连接，需要补齐结果口径。"
      ],
      outcomes,
      metrics,
      bullets: buildBullets(title, actions, techStack, outcomes, metrics)
    }
  ];
}

function updateBulletText(project, bulletId, text) {
  return {
    ...project,
    bullets: project.bullets.map((bullet) =>
      bullet.id === bulletId ? { ...bullet, text } : bullet
    )
  };
}

function extractTitle(text) {
  const match = text.match(/(?:项目|项目名称|名称)[:：]\s*([^\n。；;]+)/);
  if (match?.[1]) return cleanValue(match[1]).slice(0, 24);
  return "项目经历提炼";
}

function extractSection(text, labels, fallback) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}[:：]\\s*([^\\n。；;]{8,120})`);
    const match = text.match(pattern);
    if (match?.[1]) return cleanValue(match[1]);
  }
  return fallback;
}

function extractActions(text) {
  const verbs = ["搭建", "优化", "推动", "落地", "重构", "沉淀", "设计", "接入", "治理", "整合"];
  const actions = verbs
    .filter((verb) => text.includes(verb))
    .slice(0, 4)
    .map((verb) => `${verb}关键模块和协作流程`);

  return actions.length
    ? actions
    : ["梳理项目资料并拆解核心问题", "推进方案落地并协调相关角色", "沉淀可复用的流程和表达"];
}

function extractTechStack(text) {
  const candidates = ["React", "Vue", "Node", "JavaScript", "TypeScript", "Python", "Java", "SQL", "数据看板", "埋点", "A/B Test"];
  const found = candidates.filter((item) => text.toLowerCase().includes(item.toLowerCase()));
  return found.length ? found : ["业务流程梳理", "跨团队协作", "数据分析"];
}

function extractMetrics(text) {
  const metrics = text.match(/(?:提升|降低|减少|增长|支持|覆盖|节省)[^。；;\n]{0,24}(?:\d+%?|\d+\s*个|\d+\s*条|\d+\s*次)?/g);
  return metrics?.length ? [...new Set(metrics)].slice(0, 3) : ["提升 XX%（待补充）"];
}

function extractOutcomes(text) {
  const result = extractSection(text, ["结果", "收益", "效果", "产出"], "");
  if (result) return [result];
  return ["提升业务处理效率，支撑后续项目复用（具体指标待补充）"];
}

function buildBullets(title, actions, techStack, outcomes, metrics) {
  const primaryMetric = metrics[0] ?? "提升 XX%（待补充）";
  const primaryOutcome = outcomes[0] ?? "支撑核心业务场景落地";
  const tech = techStack.slice(0, 3).join("、");

  return [
    {
      id: createId("bullet"),
      text: `围绕${title}，${actions[0]}，打通项目目标、执行动作与结果复盘链路，${primaryMetric}。`,
      needsMetric: primaryMetric.includes("XX")
    },
    {
      id: createId("bullet"),
      text: `基于${tech}等能力，${actions[1] ?? actions[0]}，提升方案落地效率并支撑跨角色协作。`,
      needsMetric: false
    },
    {
      id: createId("bullet"),
      text: `推动项目资料、业务口径和关键结果结构化沉淀，形成可复用经验，${primaryOutcome}。`,
      needsMetric: primaryOutcome.includes("待补充")
    },
    {
      id: createId("bullet"),
      text: "识别项目推进中的关键难点，拆解为可执行任务并持续优化交付路径，支撑 XX 场景（待补充）。",
      needsMetric: true
    }
  ];
}

function cleanValue(value) {
  return value.replace(/[，,。；;]$/, "").trim();
}
