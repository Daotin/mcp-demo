import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建MCP服务器
const server = new McpServer({
  name: "Calculator",
  version: "1.0.0",
});

// 基础运算工具
server.tool(
  "calculate",
  {
    a: z.number(),
    b: z.number(),
    operator: z.enum(["+", "-", "*", "/"]),
  },
  async ({ a, b, operator }) => {
    let result: number;
    switch (operator) {
      case "+":
        result = a + b;
        break;
      case "-":
        result = a - b;
        break;
      case "*":
        result = a * b;
        break;
      case "/":
        if (b === 0) {
          return {
            content: [{ type: "text", text: "Error: Division by zero" }],
            isError: true,
          };
        }
        result = a / b;
        break;
      default:
        return {
          content: [{ type: "text", text: "Error: Invalid operator" }],
          isError: true,
        };
    }
    return {
      content: [{ type: "text", text: String(result) }],
    };
  }
);

// 复杂表达式计算工具
server.tool(
  "evaluate",
  {
    expression: z
      .string()
      .refine(
        (expr) => /^[\d\s+\-*/().]+$/.test(expr),
        "Expression can only contain numbers, operators (+, -, *, /) and parentheses"
      ),
  },
  async ({ expression }) => {
    try {
      // 安全检查:只允许数字、运算符和括号
      if (!/^[\d\s+\-*/().]+$/.test(expression)) {
        throw new Error("Invalid characters in expression");
      }

      // 计算表达式
      const result = eval(expression);

      // 检查结果是否为有效数字
      if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        throw new Error("Invalid result");
      }

      return {
        content: [{ type: "text", text: String(result) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : "Invalid expression"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 启动服务器
// 开始在Stdin上接收消息，并在Stdout上发送消息
const transport = new StdioServerTransport();
await server.connect(transport);
