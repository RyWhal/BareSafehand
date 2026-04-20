import {
  createCharacterHandler,
  getCharacterHandler,
  updateCharacterHandler
} from "./handlers/characters";
import { appCssHandler, appJsHandler, appShellHandler, robotsHandler } from "./handlers/app";
import { bootstrapHandler } from "./handlers/bootstrap";
import { healthHandler } from "./handlers/health";
import { previewHandler } from "./handlers/preview";
import type { CharacterStoreEnv } from "../persistence/characterStore";
import { notFoundResponse } from "./http";

export type Env = CharacterStoreEnv;

function characterTokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/characters\/([^/]+)$/);

  return match?.[1] ?? null;
}

function appCharacterTokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/characters\/([^/]+)$/);

  return match?.[1] ?? null;
}

export function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/") {
    return appShellHandler();
  }

  if (request.method === "GET" && url.pathname === "/app.css") {
    return appCssHandler();
  }

  if (request.method === "GET" && url.pathname === "/app.js") {
    return appJsHandler();
  }

  if (request.method === "GET" && url.pathname === "/robots.txt") {
    return robotsHandler();
  }

  const appCharacterToken = appCharacterTokenFromPath(url.pathname);

  if (request.method === "GET" && appCharacterToken) {
    return appShellHandler(appCharacterToken);
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    return healthHandler();
  }

  if (request.method === "GET" && url.pathname === "/api/content/bootstrap") {
    return bootstrapHandler();
  }

  if (request.method === "POST" && url.pathname === "/api/creation/preview") {
    return previewHandler(request);
  }

  if (request.method === "POST" && url.pathname === "/api/characters") {
    return createCharacterHandler(request, env);
  }

  const characterToken = characterTokenFromPath(url.pathname);

  if (request.method === "GET" && characterToken) {
    return getCharacterHandler(characterToken, env);
  }

  if (request.method === "PUT" && characterToken) {
    return updateCharacterHandler(request, characterToken, env);
  }

  return notFoundResponse();
}
