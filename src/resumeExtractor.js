const MIN_INPUT_LENGTH = 40;

export function validateSources(sources) {
  const readyText = sources
    .filter((source) => source.status === "ready")
    .map((source) => source.text.trim())
    .join("\n\n");

  if (readyText.length < MIN_INPUT_LENGTH) {
    return {
      ok: false,
      error: "至少补充一些项目背景、目标、你做过的动作或结果，再提炼工作经历。"
    };
  }

  return { ok: true, text: readyText };
}

export async function extractProjects(request) {
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
      id: cryptoId("project"),
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

export function updateBulletText(project, bulletId, text) {
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
      id: cryptoId("bullet"),
      text: `围绕${title}，${actions[0]}，打通项目目标、执行动作与结果复盘链路，${primaryMetric}。`,
      needsMetric: primaryMetric.includes("XX")
    },
    {
      id: cryptoId("bullet"),
      text: `基于${tech}等能力，${actions[1] ?? actions[0]}，提升方案落地效率并支撑跨角色协作。`,
      needsMetric: false
    },
    {
      id: cryptoId("bullet"),
      text: `推动项目资料、业务口径和关键结果结构化沉淀，形成可复用经验，${primaryOutcome}。`,
      needsMetric: primaryOutcome.includes("待补充")
    },
    {
      id: cryptoId("bullet"),
      text: `识别项目推进中的关键难点，拆解为可执行任务并持续优化交付路径，支撑 XX 场景（待补充）。`,
      needsMetric: true
    }
  ];
}

function cleanValue(value) {
  return value.replace(/[，,。；;]$/, "").trim();
}

function cryptoId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}
