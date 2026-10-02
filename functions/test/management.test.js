const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { manageAppointment } = require("../management");
const reference = "abcdefghijklmnopqrst";
const token = "ab".repeat(32);
const base = "artifacts/vallejotech/public/data";
const active = `${base}/appointments/${reference}`;
const archive = `${base}/completed_appointments/${reference}`;
const appointment = { name: "<Customer>", email: "customer@example.com", date: "2026-10-10", timeSlot: "09:00 AM", status: "pending", managementTokenHash: createHash("sha256").update(token).digest("hex") };
function fixture(initial = { [active]: appointment }, fail = false) {
  const records = new Map(Object.entries(initial));
  return {
    records, doc: path => path,
    runTransaction: async callback => {
      const draft = new Map(records);
      const result = await callback({
        getAll: async (...paths) => paths.map(path => ({ exists: draft.has(path), data: () => draft.get(path) })),
        set: (path, value) => draft.set(path, value),
        delete: path => draft.delete(path),
        create: (path, value) => { assert.ok(!draft.has(path)); draft.set(path, value); },
      });
      if (fail) throw new Error("Commit failed");
      records.clear(); for (const [key, value] of draft) records.set(key, value);
      return result;
    },
  };
}
const timestamp = { serverTimestamp: () => "SERVER_TIME" };
const request = (action, overrides = {}) => ({ reference, token, action, date: appointment.date, timeSlot: appointment.timeSlot, ...overrides });
test("private link displays details without disclosing token or changing records", async () => {
  const db = fixture(); const result = await manageAppointment(request("view"), db, timestamp);
  assert.equal(result.name, appointment.name); assert.equal(result.managementTokenHash, undefined); assert.equal(db.records.size, 1);
});
test("wrong or missing token and missing appointment return no details", async () => {
  for (const [db, input] of [[fixture(), request("view", { token: "cd".repeat(32) })], [fixture(), request("view", { token: "" })], [fixture({}), request("view")]]) {
    await assert.rejects(manageAppointment(input, db, timestamp), error => error.code === "not-found");
  }
});
test("cancel archives appointment and queues three emails exactly once", async () => {
  const db = fixture(); const result = await manageAppointment(request("cancel"), db, timestamp);
  assert.equal(result.status, "cancelled"); assert.ok(!db.records.has(active)); assert.equal(db.records.get(archive).status, "cancelled");
  const mails = [...db.records].filter(([key]) => key.includes("/mail/")).map(([, value]) => value);
  assert.deepEqual(mails.map(x => x.to), ["customer@example.com", "support@vallejotech.org", "ceaser.r.hernandez@gmail.com"]);
  for (const mail of mails) { assert.deepEqual(Object.keys(mail.message).sort(), ["html", "subject"]); assert.ok(mail.message.html.includes("&lt;Customer&gt;")); }
  await manageAppointment(request("cancel"), db, timestamp); assert.equal(db.records.size, 4);
});
test("stale schedule and completed appointments cannot be cancelled", async () => {
  await assert.rejects(manageAppointment(request("cancel", { date: "2026-10-11" }), fixture(), timestamp), error => error.code === "failed-precondition");
  await assert.rejects(manageAppointment(request("cancel"), fixture({ [archive]: { ...appointment, status: "completed" } }), timestamp), error => error.code === "failed-precondition");
});
test("failed transaction preserves appointment and queues no emails", async () => {
  const db = fixture(undefined, true);
  await assert.rejects(manageAppointment(request("cancel"), db, timestamp));
  assert.ok(db.records.has(active)); assert.equal(db.records.size, 1);
});
