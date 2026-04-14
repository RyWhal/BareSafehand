import { buildCreationPreview } from "../../domain/rules/preview";
import { noIndexJsonResponse, readJsonBody } from "../http";

export async function previewHandler(request: Request): Promise<Response> {
  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  return noIndexJsonResponse(buildCreationPreview(body.value));
}
