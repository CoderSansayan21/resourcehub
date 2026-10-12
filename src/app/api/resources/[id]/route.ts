import { getResourceDetails, updateResource } from "@/lib/resources";
import { readJsonBody, resourceError, resourceJson } from "../route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const resource = await getResourceDetails(id);

    return resourceJson({ resource });
  } catch (error) {
    return resourceError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const resource = await updateResource(id, body);

    return resourceJson({ resource });
  } catch (error) {
    return resourceError(error);
  }
}
