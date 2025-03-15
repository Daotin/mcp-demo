import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

// 创建一个 Express 应用
const app = express();
const PORT = 3000;

// 创建一个 MCP 服务器
const server = new McpServer({
  name: "calc-mcp",
  version: "1.0.0",
});

// 定义一个复杂的计算器工具
server.tool(
  "calculator",
  {
    expression: z.string().min(1), // 确保输入的表达式不为空
  },
  async ({ expression }) => {
    try {
      // 使用 eval 计算表达式
      const result = eval(expression);
      return {
        content: [
          {
            type: "text",
            text: `The result of the expression "${expression}" is ${result}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Invalid expression "${expression}"`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 存储传输对象
let transport: SSEServerTransport;

// 设置 SSE 传输
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // 这里需要处理来自客户端的消息
  // 注意：在实际应用中，你可能需要根据客户端的请求来路由消息到对应的传输
  await transport.handlePostMessage(req, res);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`calc-mcp server is running on http://localhost:${PORT}`);
});
