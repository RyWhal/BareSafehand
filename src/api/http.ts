export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return Response.json(body, {
    ...init,
    headers
  });
}

export function notFoundResponse(): Response {
  return jsonResponse({ error: "Not Found" }, { status: 404 });
}
