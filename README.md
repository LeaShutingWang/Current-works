# Resume Project Extractor

一个本地优先的简历项目经历提炼小工具。用户粘贴项目资料或上传文档后，工具会生成项目卡片和可编辑的简历 bullet。

## What It Does

- 粘贴项目资料、周报、技术方案、OKR 或复盘内容
- 上传 `.txt` / `.md`
- 显示结构化项目卡片
- 生成可编辑、可复制的中文简历 bullet
- 通过本地 Node server 调用 OpenAI，API key 不会进入浏览器前端
- 如果没有启动 server 或没有 key，前端会回退到本地 mock 模式

## Local Run

```powershell
cd "C:\Users\DL\Documents\你的简历咋样了"
$env:OPENAI_API_KEY="your_openai_api_key"
$env:OPENAI_MODEL="gpt-4.1-mini"
$env:APP_PASSWORD="xueyidabendan"
node server.js
```

Then open:

```text
http://localhost:8787
```

## Deploy For Friends

Do not deploy this as GitHub Pages only if you want real AI. GitHub Pages is static and cannot safely hold `OPENAI_API_KEY`.

Recommended setup:

1. Push this repo to GitHub.
2. Deploy it as a Node web service on Render.
3. Select this repository and use the included `render.yaml` blueprint.
4. Set environment variables on Render:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL=gpt-4.1-mini`
   - `APP_PASSWORD`
5. Start command:

```bash
npm start
```

6. Share the deployed service URL with friends.

## Security Notes

- Never commit `.env` or real API keys.
- Change `APP_PASSWORD` before wider sharing. The current password is only a simple friend-access gate.
- User documents are sent to your server, then to OpenAI for generation.
- If friends use your deployed service, they may consume your API quota.
- Before making this public, add authentication, rate limiting, privacy policy, and request logging rules that avoid storing raw resume/project content.

## Tests

```bash
npm test
```
