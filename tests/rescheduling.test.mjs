import test from "node:test";
import assert from "node:assert/strict";
import { toTimeInput, toTimeSlot, rescheduleMessage, RESCHEDULE_RECIPIENTS } from "../src/rescheduling.js";

test("time conversion preserves midnight, noon, and non-hour appointment times", () => {
  for (const [input, stored] of [["00:00", "12:00 AM"], ["12:00", "12:00 PM"], ["09:30", "09:30 AM"], ["16:45", "04:45 PM"]]) {
    assert.equal(toTimeSlot(input), stored);
    assert.equal(toTimeInput(stored), input);
  }
});

test("confirmation identifies old and new appointments and escapes customer content", () => {
  const message = rescheduleMessage({
    id: "request-123", name: "<script>alert(1)</script>",
    date: "2026-10-05", timeSlot: "09:00 AM", email: "customer@example.com",
    phone: "707-555-0100", address: "Main & Oak", description: "Laptop repair",
  }, { date: "2026-10-06", timeSlot: "02:30 PM" });
  assert.deepEqual(Object.keys(message).sort(), ["html", "subject"]);
  assert.match(message.html, /Oct 5, 2026/);
  assert.match(message.html, /Oct 6, 2026/);
  for (const text of ["09:00 AM", "02:30 PM", "Pacific time", "request-123", "707-555-0100", "customer@example.com", "Main &amp; Oak"]) assert.ok(message.html.includes(text));
  assert.ok(!message.html.includes("<script>"));
  assert.ok(message.html.includes("&lt;script&gt;"));
  assert.match(message.subject, /02:30 PM/);
});

test("reschedule notifications include both requested business addresses", () => {
  assert.deepEqual(RESCHEDULE_RECIPIENTS, ["support@vallejotech.org", "ceaser.r.hernandez@gmail.com"]);
});
