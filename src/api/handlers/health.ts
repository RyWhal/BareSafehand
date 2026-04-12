import { jsonResponse } from "../http";

export function healthHandler(): Response {
  return jsonResponse({ ok: true });
}
