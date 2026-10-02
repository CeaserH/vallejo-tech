import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  LayoutDashboard,
  LogOut,
  Clock,
  Search,
  CheckCircle2,
  Trash2,
  Loader2,
  Archive,
  History,
  ShieldCheck,
  Calendar,
} from "lucide-react";

import { auth, db } from "../firebase";

import AppointmentDetails from "../components/AppointmentDetails";
import { SUPPORT_EMAIL } from "../appointmentEmail";
import { RESCHEDULE_RECIPIENTS, toTimeInput, toTimeSlot, formatAppointmentDate, rescheduleMessage } from "../rescheduling";

const AdminDashboard = ({ onExit }) => {
  const [view, setView] = useState("queue");
  const [appointments, setAppointments] = useState([]);
  const [completedDocs, setCompletedDocs] = useState([]);

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [editing, setEditing] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [notice, setNotice] = useState("");
  const rescheduling = useRef(false);

  const appId = "vallejotech";
  const activeCollection = "appointments";
  const completedCollection = "completed_appointments";

  const formatTimestamp = (ts) => {
    if (!ts) return "Processing...";
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Auth + Admin Gate Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);

      if (!u) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const adminRef = doc(db, "admins", u.uid);
        const adminSnap = await getDoc(adminRef);
        setIsAdmin(adminSnap.exists());
      } catch (e) {
        console.error(e);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Firestore subscriptions (admins only)
  useEffect(() => {
    if (!user || !isAdmin) return;

    const activeRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      activeCollection
    );
    const compRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      completedCollection
    );

    const unsubActive = onSnapshot(
      activeRef,
      (s) => {
        const docs = s.docs.map((d) => ({ id: d.id, ...d.data() }));

        // ✅ Oldest first (createdAt ascending)
        docs.sort(
          (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );

        setAppointments(docs);
      },
      (e) => setError(e.message)
    );

    const unsubComp = onSnapshot(
      compRef,
      (s) => {
        const docs = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Completed newest first is fine
        docs.sort(
          (a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)
        );
        setCompletedDocs(docs);
      },
      (e) => setError(e.message)
    );

    return () => {
      unsubActive();
      unsubComp();
    };
  }, [user, isAdmin]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAppointments = useMemo(() => {
    if (!normalizedSearch) return appointments;
    return appointments.filter((a) => {
      const haystack =
        `${a.name || ""} ${a.email || ""} ${a.phone || ""} ${a.address || ""} ${a.date || ""} ${a.description || ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [appointments, normalizedSearch]);

  const filteredCompleted = useMemo(() => {
    if (!normalizedSearch) return completedDocs;
    return completedDocs.filter((a) => {
      const haystack =
        `${a.name || ""} ${a.email || ""} ${a.phone || ""} ${a.address || ""} ${a.date || ""} ${a.description || ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [completedDocs, normalizedSearch]);

  const openReschedule = (appt) => {
    setEditing(appt);
    setNewDate(appt.date || "");
    setNewTime(toTimeInput(appt.timeSlot));
    setRescheduleError("");
    setNotice("");
  };

  const handleReschedule = async (event) => {
    event.preventDefault();
    if (!isAdmin || !user || !editing || rescheduling.current) return;
    const next = { date: newDate, timeSlot: toTimeSlot(newTime) };
    if (next.date === editing.date && next.timeSlot === editing.timeSlot) {
      setRescheduleError("Choose a different date or time.");
      return;
    }
    if (!editing.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email)) {
      setRescheduleError("This appointment needs a valid customer email before rescheduling.");
      return;
    }
    rescheduling.current = true;
    setProcessingId(editing.id);
    setRescheduleError("");
    try {
      const active = collection(db, "artifacts", appId, "public", "data", activeCollection);
      const matches = await getDocs(query(active, where("date", "==", next.date)));
      if (matches.docs.some((item) => item.id !== editing.id && item.data().timeSlot === next.timeSlot)) {
        throw new Error("Another appointment already uses this date and time. Choose a different time.");
      }
      const apptRef = doc(active, editing.id);
      const mail = collection(db, "artifacts", appId, "public", "data", "mail");
      const recipients = [...new Set([editing.email.trim(), ...RESCHEDULE_RECIPIENTS])];
      const mailRefs = recipients.map(() => doc(mail));
      await runTransaction(db, async (transaction) => {
        const current = await transaction.get(apptRef);
        if (!current.exists()) throw new Error("This appointment is no longer active.");
        const latest = current.data();
        if (latest.date !== editing.date || latest.timeSlot !== editing.timeSlot || latest.email !== editing.email) {
          throw new Error("This appointment changed while you were editing. Cancel and reopen it to review the latest details.");
        }
        transaction.update(apptRef, {
          ...next, status: "confirmed", updatedAt: serverTimestamp(),
          rescheduledAt: serverTimestamp(), rescheduledBy: user.uid,
          previousDate: latest.date, previousTimeSlot: latest.timeSlot,
        });
        const message = rescheduleMessage({ ...latest, id: editing.id }, next);
        recipients.forEach((to, index) => transaction.set(mailRefs[index], {
          to, replyTo: SUPPORT_EMAIL, message,
        }));
      });
      setNotice(`Appointment updated for ${editing.name}. Confirmation emails queued for ${recipients.join(", ")}.`);
      setEditing(null);
    } catch (err) {
      console.warn("Rescheduling failed:", err);
      setRescheduleError(err.message || "Could not reschedule. No changes were saved.");
    } finally {
      rescheduling.current = false;
      setProcessingId(null);
    }
  };

  const handleComplete = async (appt) => {
    if (!user || !isAdmin) return;
    setProcessingId(appt.id);
    setError(null);

    try {
      const completedRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        completedCollection,
        appt.id
      );

      const activeRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        activeCollection,
        appt.id
      );
      await runTransaction(db, async (transaction) => {
        const current = await transaction.get(activeRef);
        if (!current.exists()) throw new Error("This appointment is no longer active.");
        transaction.set(completedRef, { ...current.data(), status: "completed", completedAt: serverTimestamp() });
        transaction.delete(activeRef);
      });
    } catch (err) {
      console.error(err);
      setError("Failed to archive record.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id, collName) => {
    if (!user || !isAdmin) return;
    if (!window.confirm("Permanently delete this record?")) return;

    setProcessingId(id);
    setError(null);

    try {
      const docRef = doc(db, "artifacts", appId, "public", "data", collName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(err);
      setError("Failed to delete record.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      onExit?.();
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 p-10 rounded-3xl text-center">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Admin <span className="text-blue-600">Login</span> Required
          </h2>
          <button
            onClick={onExit}
            className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Return
          </button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-red-500/20 p-10 rounded-3xl text-center">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Access <span className="text-red-500">Denied</span>
          </h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-3">
            This account is not in the admin whitelist.
          </p>
          <button
            onClick={handleLogout}
            className="mt-8 w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <nav className="w-full md:w-72 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col justify-between">
        <div className="space-y-10">
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">
              Vallejo<span className="text-blue-600">Tech</span>
            </h1>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-1">
              Appointment management
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => { setView("queue"); if (!processingId) setEditing(null); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-xs uppercase border transition-all ${
                view === "queue"
                  ? "bg-blue-600/10 text-blue-500 border-blue-600/20"
                  : "text-gray-500 border-transparent hover:text-white"
              }`}
            >
              <LayoutDashboard size={18} /> Active Queue
            </button>

            <button
              onClick={() => { setView("archive"); if (!processingId) setEditing(null); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-xs uppercase border transition-all ${
                view === "archive"
                  ? "bg-blue-600/10 text-blue-500 border-blue-600/20"
                  : "text-gray-500 border-transparent hover:text-white"
              }`}
            >
              <Archive size={18} /> Completed / Cancelled
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 text-red-500/70 hover:text-red-500 font-bold text-xs uppercase transition-all border border-transparent hover:border-red-500/20 rounded-xl"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </nav>

      {/* MAIN */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">
              {view === "queue" ? (
                <>
                  Active <span className="text-blue-600">Queue</span>
                </>
              ) : (
                <>
                  Service <span className="text-blue-600">Ledger</span>
                </>
              )}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              {view === "queue"
                ? `Active appointments: ${appointments.length}`
                : `Archived Records: ${completedDocs.length}`}
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={16}
            />
            <input
              type="text"
              aria-label="Search appointments"
              placeholder="Search name, phone, email?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50"
            />
          </div>
        </header>

        {notice && <div role="status" className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-200 text-sm break-words">{notice}</div>}

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        {/* Queue */}
        {view === "queue" ? (
          <div className="grid gap-6">
            {filteredAppointments.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <Clock className="mx-auto text-gray-700 mb-4" size={48} />
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                  Queue is currently clear
                </p>
              </div>
            ) : (
              filteredAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-2xl"
                >
                  {processingId === appt.id && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-500" />
                    </div>
                  )}

                  <div className="flex flex-col xl:flex-row gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold break-words">{appt.name}</h3>
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold">{appt.status === "confirmed" ? "Confirmed" : "Pending confirmation"}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-6">Submitted {formatTimestamp(appt.createdAt)}</p>
                      <AppointmentDetails appointment={appt} />
                      <p className="mt-4 text-xs text-gray-500 break-all">Reference: {appt.id}</p>
                    </div>
                    <div className="xl:w-72 shrink-0 p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                      <p className="text-sm text-blue-300 font-semibold mb-3">{appt.status === "confirmed" ? "Appointment" : "Requested appointment"}</p>
                      <p className="text-xl font-bold">{formatAppointmentDate(appt.date)}</p>
                      <p className="text-2xl font-bold mt-2">{appt.timeSlot}</p>
                      <p className="text-sm text-gray-400 mt-1">Pacific time</p>
                      {appt.previousDate && <p className="text-xs text-gray-400 mt-4">Rescheduled from {formatAppointmentDate(appt.previousDate)} at {appt.previousTimeSlot}</p>}
                      <button disabled={!!processingId} onClick={() => openReschedule(appt)} className="mt-6 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"><Calendar size={18} /> Reschedule</button>
                      <div className="flex gap-2 mt-3">
                        <button disabled={!!processingId} onClick={() => handleComplete(appt)} className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Complete</button>
                        <button disabled={!!processingId} aria-label={`Delete appointment for ${appt.name}`} onClick={() => handleDelete(appt.id, activeCollection)} className="p-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Completed */
          <div className="space-y-6">
            {filteredCompleted.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <History className="mx-auto text-gray-700 mb-4" size={48} />
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                  No service history yet
                </p>
              </div>
            ) : (
              filteredCompleted.map((docItem) => (
                <div
                  key={docItem.id}
                  className="bg-[#0a0a0a]/50 border border-white/5 p-6 rounded-3xl group hover:bg-[#0a0a0a] transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                        <ShieldCheck size={18} className="text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase italic text-lg">{docItem.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black uppercase text-blue-500/70 flex items-center gap-1">
                            <Calendar size={10} /> Scheduled: {docItem.date}
                          </span>
                          <span className="text-[9px] font-black uppercase text-green-500/70 flex items-center gap-1">
                            <History size={10} /> Closed: {formatTimestamp(docItem.completedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="bg-black/60 px-4 py-2 rounded-xl border border-white/5 text-center">
                        <p className="text-[8px] font-bold text-gray-500 uppercase">Status</p>
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-tighter">{docItem.status === "cancelled" ? "Cancelled by customer" : "Completed"}</p>
                      </div>

                      <button
                        onClick={() => handleDelete(docItem.id, completedCollection)}
                        className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <AppointmentDetails appointment={docItem} />
                    <p className="text-sm text-gray-400 mt-4">Appointment time: {docItem.timeSlot} Pacific time</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {editing && (
          <div className="mt-8 p-6 sm:p-8 rounded-2xl border border-blue-500/40 bg-[#10141c]" ref={(node) => { if (node && !node.dataset.focused) { node.dataset.focused = "true"; node.scrollIntoView({ behavior: "smooth", block: "center" }); node.querySelector("input")?.focus({ preventScroll: true }); } }}>
            <h3 className="text-2xl font-bold mb-2">Reschedule {editing.name}</h3>
            <p className="text-gray-300 text-sm mb-6">Current: {formatAppointmentDate(editing.date)} at {editing.timeSlot} Pacific time</p>
            <form onSubmit={handleReschedule}>
              <fieldset disabled={!!processingId} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="text-sm text-gray-300">New date<input required type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="block mt-2 w-full bg-black border border-white/20 rounded-xl p-3 text-white" /></label>
                  <label className="text-sm text-gray-300">New time (Pacific)<input required type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="block mt-2 w-full bg-black border border-white/20 rounded-xl p-3 text-white" /></label>
                </div>
                <div className="text-sm text-gray-300 break-words">
                  <p className="font-semibold mb-2">Save will confirm the new appointment and email:</p>
                  <ul className="list-disc pl-5 space-y-1">{[...new Set([editing.email, ...RESCHEDULE_RECIPIENTS])].map((email) => <li key={email}>{email}</li>)}</ul>
                </div>
                {rescheduleError && <p role="alert" className="text-red-300 text-sm">{rescheduleError}</p>}
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-semibold">{processingId ? "Saving?" : "Save & send confirmations"}</button>
                  <button type="button" onClick={() => setEditing(null)} className="px-5 py-3 rounded-xl border border-white/20">Cancel</button>
                </div>
              </fieldset>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
