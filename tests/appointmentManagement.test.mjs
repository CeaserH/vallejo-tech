import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createManagementAccess } from "../src/appointmentManagement.js";
import { appointmentMessage } from "../src/appointmentEmail.js";
import { rescheduleMessage } from "../src/rescheduling.js";

test("private management links use a random token in the fragment and store its hash", async () => {
  globalThis.window = { location: { origin: "https://vallejotech.org", hostname: "vallejotech.org" } };
  const a = await createManagementAccess("abcdefghijklmnopqrst");
  const b = await createManagementAccess("abcdefghijklmnopqrst");
  const url = new URL(a.managementUrl);
  assert.equal(url.search, "");
  const params = new URLSearchParams(url.hash.slice(1));
  assert.equal(params.get("appointment"), "abcdefghijklmnopqrst");
  assert.match(params.get("token"), /^[a-f0-9]{64}$/);
  assert.equal(createHash("sha256").update(params.get("token")).digest("hex"), a.managementTokenHash);
  assert.notEqual(a.managementUrl, b.managementUrl);
});
test("custom templates and fallback confirmations both include reference and management link", () => {
  const data = { reference: "abcdefghijklmnopqrst", date: "2026-10-10", timeSlot: "09:00 AM", managementUrl: "https://vallejotech.org/#appointment=abcdefghijklmnopqrst&token=abc" };
  for (const template of [null, { subject: "Request received", html: "<p>Custom template</p>" }]) {
    const result = appointmentMessage(data, template);
    assert.ok(result.html.includes("View or cancel your appointment"));
    assert.ok(result.html.includes("Appointment reference: abcdefghijklmnopqrst"));
    assert.ok(result.html.includes("&amp;token=abc"));
    assert.deepEqual(Object.keys(result).sort(), ["html", "subject"]);
  }
  assert.ok(rescheduleMessage(data, data).html.includes("View or cancel your appointment"));
});
