import React, { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import AppointmentDetails from "../components/AppointmentDetails";
import { formatAppointmentDate } from "../rescheduling";

export default function AppointmentPage() {
  const [appointment, setAppointment] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [credentials] = useState(() => {
    const values = new URLSearchParams(window.location.hash.slice(1));
    return { reference: values.get("appointment"), token: values.get("token") };
  });
  async function request(action) {
    setBusy(true); setError("");
    try {
      const call = httpsCallable(getFunctions(undefined, "us-west2"), "manageAppointment");
      const result = await call({ ...credentials, action, ...(action === "cancel" ? { date: appointment.date, timeSlot: appointment.timeSlot } : {}) });
      setAppointment(result.data); setConfirm(false);
    } catch (err) {
      setError(err.code === "functions/not-found" ? "This private link is invalid or no longer available. Please use the link in your latest confirmation email." : err.code === "functions/failed-precondition" ? err.message : "We couldn’t update or load your appointment. Please try again. If you already cancelled, reload the details to check its status.");
    } finally { setBusy(false); }
  }
  useEffect(() => { request("view"); }, []);
  return <main className="max-w-3xl mx-auto px-4 py-12 text-white">
    <div className="p-6 sm:p-10 bg-[#0a0a0a] rounded-3xl border border-white/10">
      <h1 className="text-3xl font-bold mb-4">Your appointment</h1>
      {busy && <p role="status" className="text-blue-300 mb-4">Please wait…</p>}
      {error && <p role="alert" className="text-red-300 mb-4">{error}</p>}
      {appointment && <>
        <p className="text-lg font-semibold mb-3">{appointment.name}</p>
        <p className="text-blue-300 font-semibold mb-2">{appointment.status === "cancelled" ? "Cancelled" : appointment.status === "completed" ? "Completed" : appointment.status === "confirmed" ? "Confirmed" : "Pending confirmation"}</p>
        <p className="text-xl font-semibold">{formatAppointmentDate(appointment.date)} at {appointment.timeSlot}</p>
        <p className="text-gray-400 mb-6">Pacific time · Reference: {appointment.reference}</p>
        <AppointmentDetails appointment={appointment} />
        {appointment.status === "cancelled" ? <p role="status" className="mt-6 text-green-300">Your appointment is cancelled. Cancellation notifications have been queued for you and Vallejo Tech.</p> : appointment.status !== "completed" && <div className="mt-8">
          {confirm ? <div className="p-4 border border-red-500/30 rounded-xl"><p className="mb-4">Cancel this appointment? Your reserved time will be released.</p><div className="flex gap-3 flex-wrap"><button disabled={busy} onClick={() => request("cancel")} className="bg-red-600 px-4 py-3 rounded-xl disabled:opacity-50">Yes, cancel appointment</button><button disabled={busy} onClick={() => setConfirm(false)} className="border border-white/20 px-4 py-3 rounded-xl">Keep appointment</button></div></div> : <button disabled={busy} onClick={() => setConfirm(true)} className="border border-red-500/40 text-red-300 px-4 py-3 rounded-xl disabled:opacity-50">Cancel appointment</button>}
        </div>}
      </>}
      {error && <button disabled={busy} onClick={() => request("view")} className="mt-4 text-blue-300 underline">Reload appointment details</button>}
      <p className="mt-8 text-sm text-gray-400">Need help? <a className="text-blue-300 underline" href="mailto:support@vallejotech.org">support@vallejotech.org</a></p>
    </div>
  </main>;
}
