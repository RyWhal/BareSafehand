import { handleRequest } from "./api/routes";
import type { Env } from "./api/routes";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handleRequest(request, env, ctx);
  }
};
