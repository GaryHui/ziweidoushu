import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import astrolabeHandler from "./api/astrolabe.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicRoot = join(root, "public");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

createServer(async (req, res) => {
  try {
    if (req.url === "/api/astrolabe") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          req.body = body ? JSON.parse(body) : {};
          astrolabeHandler(req, createJsonResponse(res));
        } catch (error) {
          createJsonResponse(res).status(400).json({ error: "请求格式不正确。", detail: error.message });
        }
      });
      return;
    }

    if (req.url === "/api/qianwen") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        answer: "本地预览未连接千问。部署到 Vercel 后配置 DASHSCOPE_API_KEY 即可启用 AI 补充解读。"
      }));
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(publicRoot, safePath);
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Zi Wei Dou Shu app running at http://localhost:${port}`);
});

function createJsonResponse(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      res.writeHead(res.statusCode || 200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(payload));
    }
  };
}
