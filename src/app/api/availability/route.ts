import { getResourceAvailability } from "@/lib/availability";
import { availabilityError, availabilityJson } from "./route-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const date = searchParams.get("date");
    const timeZone = searchParams.get("timeZone");

    if (!resourceId || !date || !timeZone) {
      return availabilityJson(
        {
          error: {
            message: "resourceId, date, and timeZone are required.",
          },
        },
        { status: 400 },
      );
    }

    const availability = await getResourceAvailability({
      date,
      resourceId,
      timeZone,
    });

    return availabilityJson({ availability });
  } catch (error) {
    return availabilityError(error);
  }
}
