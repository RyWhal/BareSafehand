import { bootstrapHandler } from "./handlers/bootstrap";
import { healthHandler } from "./handlers/health";
import { previewHandler } from "./handlers/preview";
import { notFoundResponse } from "./http";

export type Env = Record<string, never>;

export function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return healthHandler();
  }

  if (request.method === "GET" && url.pathname === "/api/content/bootstrap") {
    return bootstrapHandler();
  }

  if (request.method === "POST" && url.pathname === "/api/creation/preview") {
    return previewHandler(request);
  }

  return notFoundResponse();
}
