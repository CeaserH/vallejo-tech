import { managementEmailFooter } from "./appointmentManagement.js";
import { escapeHtml, SUPPORT_EMAIL, BUSINESS_EMAILS } from "./appointmentEmail.js";

export const RESCHEDULE_RECIPIENTS = BUSINESS_EMAILS;

export function toTimeInput(value = "") {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  return `${String(Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0)).padStart(2, "0")}:${match[2]}`;
}

export function toTimeSlot(value) {
  const [hour, minute] = value.split(":").map(Number);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

export function formatAppointmentDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Date not set" : date.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export function rescheduleMessage(appointment, next) {
  const rows = [
    ["Customer", appointment.name],
    ["Previous appointment", `${formatAppointmentDate(appointment.date)} at ${appointment.timeSlot}`],
    ["New appointment", `${formatAppointmentDate(next.date)} at ${next.timeSlot}`],
    ["Service address", appointment.address], ["Phone", appointment.phone],
    ["Email", appointment.email], ["Issue", appointment.description],
    ["Request reference", appointment.id],
  ];
  return {
    subject: `Appointment rescheduled — ${formatAppointmentDate(next.date)} at ${next.timeSlot}`,
    html: `<h2>Your Vallejo Tech appointment has been rescheduled</h2><p>This confirms your updated appointment. All times are Pacific time.</p>${rows.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")}<p>Questions? Contact ${SUPPORT_EMAIL}.</p>` + managementEmailFooter(appointment),
  };
}
