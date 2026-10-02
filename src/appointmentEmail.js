import { insertManagementAction } from "./appointmentManagement.js";
export const SUPPORT_EMAIL = "support@vallejotech.org";
export const BUSINESS_EMAILS = [SUPPORT_EMAIL, "ceaser.r.hernandez@gmail.com"];

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

export function appointmentMessage(data, template, business = false) {
  const vars = { ...data, time: data.timeSlot };
  const fill = (text, html = false) => text.replace(/\{\{(\w+)\}\}/g,
    (_, key) => html ? escapeHtml(vars[key]) : String(vars[key] ?? ""));
  const rows = [
    ["Name", data.name], ["Email", data.email], ["Phone", data.phone],
    ["Address", data.address], ["Requested date", data.date],
    ["Requested time (Pacific)", data.timeSlot], ["Issue", data.description],
  ];
  const heading = business ? "New Appointment Request" : "Your Vallejo Tech Appointment Request";
  const next = "This request is pending. Vallejo Tech will contact you to confirm your appointment.";
  const html = template?.html ? fill(template.html, true) :
    `<h2>${heading}</h2><p>${next}</p>${rows.map(([label, value]) =>
      `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")}`;
  return {
    subject: template?.subject ? fill(template.subject) : heading,
    html: business ? html : insertManagementAction(html, data),
  };
}
