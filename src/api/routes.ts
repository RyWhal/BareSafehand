import { healthHandler } from "./handlers/health";
import { notFoundResponse } from "./http";

export type Env = Record<string, never>;

export function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return healthHandler();
  }

  return notFoundResponse();
}
