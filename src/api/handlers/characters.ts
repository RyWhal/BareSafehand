import type { ZodError } from "zod";
import { normalizeCharacterInput } from "../../domain/models/character";
import { buildCreationPreview } from "../../domain/rules/preview";
import {
  createCharacter,
  getCharacterByToken,
  updateCharacterByToken,
  type CharacterStoreEnv
} from "../../persistence/characterStore";
import {
  noIndexJsonResponse,
  notFoundIssueResponse,
  readJsonBody,
  validationFailedResponse
} from "../http";

function editUrlFor(request: Request, token: string): string {
  return new URL(`/api/characters/${token}`, request.url).toString();
}

function zodIssues(error: ZodError): Array<{
  code: "VALIDATION_FAILED";
  message: string;
  path: Array<string | number>;
  context: Record<string, unknown>;
}> {
  return error.issues.map((issue) => ({
    code: "VALIDATION_FAILED" as const,
    message: issue.message,
    path: issue.path,
    context: {}
  }));
}

export async function createCharacterHandler(request: Request, env: CharacterStoreEnv): Promise<Response> {
  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const preview = buildCreationPreview(body.value);

  if (preview.errors.length > 0) {
    return validationFailedResponse(preview.errors);
  }

  const created = await createCharacter(env, preview.character);

  return noIndexJsonResponse(
    {
      envelope: created.envelope,
      editToken: created.editToken,
      editUrl: editUrlFor(request, created.editToken)
    },
    { status: 201 }
  );
}

export async function getCharacterHandler(token: string, env: CharacterStoreEnv): Promise<Response> {
  const envelope = await getCharacterByToken(env, token);

  if (!envelope) {
    return notFoundIssueResponse("Character not found.");
  }

  return noIndexJsonResponse({ envelope });
}

export async function updateCharacterHandler(
  request: Request,
  token: string,
  env: CharacterStoreEnv
): Promise<Response> {
  const existing = await getCharacterByToken(env, token);

  if (!existing) {
    return notFoundIssueResponse("Character not found.");
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  try {
    const parsed = normalizeCharacterInput(body.value);
    const updatedAt = new Date().toISOString();
    const nextCharacter = normalizeCharacterInput({
      ...parsed,
      id: existing.id,
      meta: {
        ...parsed.meta,
        createdAt: existing.createdAt,
        updatedAt
      }
    });

    const envelope = await updateCharacterByToken(env, token, nextCharacter);

    if (!envelope) {
      return notFoundIssueResponse("Character not found.");
    }

    return noIndexJsonResponse({ envelope });
  } catch (error) {
    if (typeof error === "object" && error !== null && "issues" in error) {
      return validationFailedResponse(zodIssues(error as ZodError));
    }

    return validationFailedResponse([
      {
        code: "VALIDATION_FAILED",
        message: "Character payload failed validation.",
        path: [],
        context: {}
      }
    ]);
  }
}
