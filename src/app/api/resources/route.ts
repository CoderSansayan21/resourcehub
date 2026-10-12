import {
  createResource,
  listResourcesForCurrentUser,
} from "@/lib/resources";
import { readJsonBody, resourceError, resourceJson } from "./route-utils";

export async function GET() {
  try {
    const resources = await listResourcesForCurrentUser();
    return resourceJson({ resources });
  } catch (error) {
    return resourceError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const resource = await createResource(body);

    return resourceJson({ resource }, { status: 201 });
  } catch (error) {
    return resourceError(error);
  }
}
