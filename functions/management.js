const { HttpsError } = require("firebase-functions/v2/https");
const { createHash, timingSafeEqual } = require("node:crypto");
const base = "artifacts/vallejotech/public/data";
const escape = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

function validate(data) {
  if (!data || !/^[a-zA-Z0-9]{20}$/.test(data.reference) || !/^[a-f0-9]{64}$/.test(data.token)) {
    throw new HttpsError("not-found", "This appointment link is invalid or no longer available.");
  }
}
function authorize(appointment, token) {
  const expected = appointment?.managementTokenHash;
  const hash = createHash("sha256").update(token).digest("hex");
  if (!expected || !/^[a-f0-9]{64}$/.test(expected) || !timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) {
    throw new HttpsError("not-found", "This appointment link is invalid or no longer available.");
  }
}
function details(a, reference, status) {
  return Object.fromEntries(Object.entries({ reference, status, name: a.name, email: a.email, phone: a.phone, address: a.address, date: a.date, timeSlot: a.timeSlot, description: a.description }).filter(([, value]) => value !== undefined));
}
async function manageAppointment(data, db, FieldValue) {
  validate(data);
  if (!["view", "cancel"].includes(data.action)) throw new HttpsError("invalid-argument", "Invalid action.");
  return db.runTransaction(async tx => {
    const active = db.doc(`${base}/appointments/${data.reference}`);
    const completed = db.doc(`${base}/completed_appointments/${data.reference}`);
    const [current, archived] = await tx.getAll(active, completed);
    const snapshot = current.exists ? current : archived;
    const appt = snapshot.data();
    authorize(appt, data.token);
    const status = current.exists ? (appt.status || "pending") : (appt.status === "cancelled" ? "cancelled" : "completed");
    if (data.action === "view" || status === "cancelled") return details(appt, data.reference, status);
    if (status === "completed") throw new HttpsError("failed-precondition", "Completed appointments cannot be cancelled.");
    // The customer must confirm the date/time they actually reviewed.
    if (data.date !== appt.date || data.timeSlot !== appt.timeSlot) throw new HttpsError("failed-precondition", "Your appointment changed. Reload the details before cancelling.");
    const cancelled = { ...appt, status: "cancelled", cancelledAt: FieldValue.serverTimestamp(), cancelledBy: "customer", completedAt: FieldValue.serverTimestamp() };
    tx.set(completed, cancelled);
    tx.delete(active);
    const message = {
      subject: "Your Vallejo Tech appointment has been cancelled",
      html: `<h2>Appointment cancelled</h2><p>Your appointment has been cancelled. No further action is needed.</p>${[["Reference", data.reference],["Name", appt.name],["Date", appt.date],["Time (Pacific)", appt.timeSlot],["Address", appt.address],["Email", appt.email],["Phone", appt.phone]].map(([label,value])=>`<p><strong>${label}:</strong> ${escape(value)}</p>`).join("")}<p>Questions? Contact support@vallejotech.org.</p>`,
    };
    [...new Set([appt.email, "support@vallejotech.org", "ceaser.r.hernandez@gmail.com"])].forEach((to, index) => {
      tx.create(db.doc(`${base}/mail/${data.reference}-cancel-${index}`), { to, replyTo: "support@vallejotech.org", message });
    });
    return details(appt, data.reference, "cancelled");
  });
}
module.exports = { manageAppointment };
