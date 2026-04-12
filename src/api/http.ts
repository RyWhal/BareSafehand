export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });
}

export function notFoundResponse(): Response {
  return jsonResponse({ error: "Not Found" }, { status: 404 });
}
