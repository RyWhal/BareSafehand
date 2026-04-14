const NO_INDEX_VALUE = "noindex, nofollow, noarchive";

function buildHeaders(init?: HeadersInit): Headers {
  return new Headers(init);
}

export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = buildHeaders(init?.headers);

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

export function noIndexHeaders(init?: HeadersInit): Headers {
  const headers = buildHeaders(init);
  headers.set("x-robots-tag", NO_INDEX_VALUE);
  return headers;
}

export function noIndexJsonResponse(body: unknown, init?: ResponseInit): Response {
  return jsonResponse(body, {
    ...init,
    headers: noIndexHeaders(init?.headers)
  });
}

export function badRequestJsonResponse(message = "Malformed JSON body"): Response {
  return noIndexJsonResponse(
    {
      errors: [
        {
          code: "BAD_REQUEST",
          message,
          path: [],
          context: {}
        }
      ]
    },
    { status: 400 }
  );
}

export function validationFailedResponse(
  errors: Array<{
    code: string;
    message: string;
    path: Array<string | number>;
    context: Record<string, unknown>;
  }>
): Response {
  return noIndexJsonResponse({ errors }, { status: 400 });
}

export function notFoundIssueResponse(message = "Not found."): Response {
  return noIndexJsonResponse(
    {
      errors: [
        {
          code: "NOT_FOUND",
          message,
          path: [],
          context: {}
        }
      ]
    },
    { status: 404 }
  );
}

export async function readJsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  try {
    return {
      ok: true,
      value: await request.json()
    };
  } catch {
    return {
      ok: false,
      response: badRequestJsonResponse()
    };
  }
}
