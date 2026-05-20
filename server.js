import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import {
  buildSessionCookie,
  isAuthenticated,
  verifyPassword
} from "./src/auth.js";
import { extractWithOpenAI } from "./src/openAiProvider.js";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "0.0.0.0";
const ROOT = process.cwd();
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const APP_PASSWORD = process.env.APP_PASSWORD ?? "xueyidabendan";
const SESSION_TOKEN = process.env.SESSION_TOKEN ?? randomUUID();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      send(response, 204, "");
      return;
    }

    if (request.method === "GET" && request.url === "/login") {
      send(response, 200, loginPage(), "text/html; charset=utf-8");
      return;
    }

    if (request.method === "POST" && request.url === "/api/login") {
      const body = JSON.parse(await readBody(request));
      if (!verifyPassword(body.password, APP_PASSWORD)) {
        sendJson(response, 401, { error: "密码不对，再试一次。" });
        return;
      }
      sendJson(response, 200, { ok: true }, { "Set-Cookie": buildSessionCookie(SESSION_TOKEN) });
      return;
    }

    if (!isAuthenticated(request.headers.cookie, SESSION_TOKEN)) {
      if (request.url?.startsWith("/api/")) {
        sendJson(response, 401, { error: "请先输入访问密码。" });
        return;
      }
      sendRedirect(response, "/login");
      return;
    }

    if (request.method === "GET" && request.url === "/api/status") {
      sendJson(response, 200, {
        mode: process.env.OPENAI_API_KEY ? "openai" : "missing-key",
        model: MODEL
      });
      return;
    }

    if (request.method === "POST" && request.url === "/api/extract") {
      const body = JSON.parse(await readBody(request));
      const projects = await extractWithOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: MODEL,
        sources: body.sources ?? []
      });
      sendJson(response, 200, { projects, provider: "openai", model: MODEL });
      return;
    }

    if (request.method === "GET") {
      await serveStatic(request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Resume extractor running at http://localhost:${PORT}`);
  console.log(`Bind host: ${HOST}`);
  console.log(`OpenAI mode: ${process.env.OPENAI_API_KEY ? MODEL : "missing OPENAI_API_KEY"}`);
});

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(ROOT, pathname));

  if (!filePath.startsWith(ROOT)) {
    send(response, 403, "Forbidden");
    return;
  }

  const content = await readFile(filePath);
  send(response, 200, content, MIME_TYPES[extname(filePath)] ?? "application/octet-stream");
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendJson(response, status, body, extraHeaders = {}) {
  send(response, status, JSON.stringify(body), "application/json; charset=utf-8", extraHeaders);
}

function send(response, status, body, contentType = "text/plain; charset=utf-8", extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders
  });
  response.end(body);
}

function sendRedirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function loginPage() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>访问密码</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #eef2f5;
        color: #17202a;
        font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
      }
      main {
        width: min(420px, calc(100vw - 32px));
        border: 1px solid #d8dee6;
        border-radius: 8px;
        background: #fff;
        padding: 22px;
        box-shadow: 0 18px 45px rgba(22, 34, 51, 0.08);
      }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 18px; color: #667085; line-height: 1.6; }
      label { display: block; margin-bottom: 8px; font-weight: 700; }
      input {
        width: 100%;
        border: 1px solid #d8dee6;
        border-radius: 8px;
        padding: 11px 12px;
        font: inherit;
      }
      button {
        width: 100%;
        margin-top: 12px;
        border: 0;
        border-radius: 8px;
        background: #176b87;
        color: white;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        padding: 12px;
      }
      .error { min-height: 20px; margin-top: 10px; color: #b42318; font-size: 13px; }
    </style>
  </head>
  <body>
    <main>
      <h1>输入访问密码</h1>
      <p>这是一个私人简历提炼工具。输入密码后继续。</p>
      <form id="loginForm">
        <label for="password">访问密码</label>
        <input id="password" name="password" type="password" autocomplete="current-password" autofocus />
        <button type="submit">进入</button>
        <div class="error" id="error"></div>
      </form>
    </main>
    <script>
      document.querySelector("#loginForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const error = document.querySelector("#error");
        error.textContent = "";
        const password = document.querySelector("#password").value;
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });
        if (response.ok) {
          location.href = "/";
          return;
        }
        const payload = await response.json().catch(() => ({}));
        error.textContent = payload.error || "登录失败。";
      });
    </script>
  </body>
</html>`;
}
