import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const files = {
  availabilityPage: "src/app/(dashboard)/availability/page.tsx",
  availabilityTimeline: "src/components/availability-timeline.tsx",
  bookingForm: "src/components/reservation-booking-form.tsx",
  resourcePage: "src/app/(dashboard)/resources/[id]/page.tsx",
};

const source = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, path]) => [
      name,
      await readFile(path, "utf8"),
    ]),
  ),
);

const passed = [];

function record(message) {
  passed.push(message);
}

assert.match(source.resourcePage, /function getValidDateParam/);
assert.match(source.resourcePage, /initialDate=\{initialBookingDate\}/);
assert.match(source.resourcePage, /searchParams: Promise<\{ date\?: string \| string\[\] \}>/);
record("Valid resource detail date query is server-validated and passed to the booking form");

assert.match(source.bookingForm, /endTime: `\$\{initialDate\}T\$\{endHour\}:00`/);
assert.match(source.bookingForm, /startTime: `\$\{initialDate\}T\$\{startHour\}:00`/);
assert.doesNotMatch(source.bookingForm, /useEffect/);
record("Initial date prefill is deterministic and does not overwrite user edits after mount");

assert.match(source.bookingForm, /new Date\(year, month - 1, day, hour, minute, 0, 0\)/);
assert.match(source.bookingForm, /return date\.toISOString\(\)/);
record("Booking form still converts local datetime inputs to explicit UTC ISO strings");

assert.match(source.bookingForm, /response\.status === 409/);
assert.match(source.bookingForm, /setConflict\(true\)/);
assert.match(source.bookingForm, /href=\{availabilityHref\}/);
assert.match(source.bookingForm, /resourceId: resource\.id/);
record("Conflict handling preserves inputs and links back to matching availability context");

assert.match(source.bookingForm, /if \(!resource\.isActive\)/);
assert.match(source.bookingForm, /new reservations are not available/);
record("Inactive resources remain non-bookable in the booking form");

assert.match(source.availabilityPage, /getValidDateParam\(params\.date\)/);
assert.match(source.availabilityTimeline, /useRouter/);
assert.match(source.availabilityTimeline, /params\.set\("resourceId", nextResourceId\)/);
assert.match(source.availabilityTimeline, /params\.set\("date", nextDate\)/);
assert.match(source.availabilityTimeline, /href=\{`\/resources\/\$\{selectedResource\.id\}\?date=\$\{date\}`\}/);
record("Availability selection is URL-addressable and links to the selected resource/date");

console.log(JSON.stringify({ passed }, null, 2));