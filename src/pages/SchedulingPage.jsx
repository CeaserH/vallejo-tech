import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ✅ IMPORTANT: use initialized instances
import { auth, db } from "../firebase";

import { appointmentMessage, SUPPORT_EMAIL, BUSINESS_EMAILS } from "../appointmentEmail";

import { createManagementAccess } from "../appointmentManagement";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js";

let mapsPromise;
function loadGoogleMapsPlaces(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  if (!apiKey) return Promise.reject(new Error("Google Maps key is missing."));
  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    const script = existing || document.createElement("script");
    const timer = setTimeout(() => fail(), 15000);
    function fail() {
      clearTimeout(timer);
      script.remove();
      reject(new Error("Address suggestions could not be loaded."));
    }
    function ready() {
      clearTimeout(timer);
      if (window.google?.maps?.places) resolve();
      else fail();
    }
    script.addEventListener("load", ready, { once: true });
    script.addEventListener("error", fail, { once: true });
    if (!existing) {
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    mapsPromise = null;
    throw error;
  });
  return mapsPromise;
}

const SchedulingPage = ({ setPage }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date: "",
    timeSlot: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [managementUrl, setManagementUrl] = useState("");
  const [emailWarning, setEmailWarning] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(null);

  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const appId = "vallejotech";

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  // Ensure anonymous auth for customers
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((e) =>
          console.error("Auth initialization failed:", e)
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // Load Google Maps Places ONLY on this page
  useEffect(() => {
    let active = true;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (active) {
        setMapsReady(false);
        setMapsError("Address suggestions are unavailable.");
      }
      previousAuthFailure?.();
    };
    const apiKey = process.env.PARCEL_GOOGLE_MAPS_API_KEY;

    loadGoogleMapsPlaces(apiKey)
      .then(() => {
        if (!active) return;
        setMapsReady(true);
        setMapsError(null);
      })
      .catch((e) => {
        if (!active) return;
        console.error(e);
        setMapsReady(false);
        setMapsError(e.message || "Failed to load Google Maps.");
      });
    return () => {
      active = false;
      window.gm_authFailure = previousAuthFailure;
    };
  }, []);

  // Initialize Places Autocomplete once Maps is ready
  useEffect(() => {
    if (!mapsReady) return;
    if (!addressInputRef.current) return;
    if (!window.google || !window.google.maps || !window.google.maps.places)
      return;

    if (autocompleteRef.current) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["formatted_address"],
          types: ["address"],
        }
      );

      const listener = autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place?.formatted_address) {
          setFormData((prev) => ({ ...prev, address: place.formatted_address }));
          setError(null);
        }
      });
      return () => {
        listener.remove();
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      };
    } catch (error) {
      console.error("Address autocomplete failed:", error);
      setMapsError("Address suggestions are unavailable.");
      setMapsReady(false);
    }
  }, [mapsReady]);

  // Availability fetch
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.date) return;

      setCheckingAvailability(true);
      try {
        const appointmentsRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "appointments"
        );

        const q = query(appointmentsRef, where("date", "==", formData.date));
        const querySnapshot = await getDocs(q);
        const booked = querySnapshot.docs.map((doc) => doc.data().timeSlot);
        setBookedSlots(booked);
      } catch (err) {
        console.error("Availability Check Error:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchAvailability();
  }, [formData.date]);

  async function fetchTemplate(templateId) {
    const tplRef = doc(db, "emailTemplates", templateId);
    try {
      const snap = await getDoc(tplRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      console.warn(`Email template unavailable: ${templateId}`, error.code);
      return null;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!formData.address.trim()) {
      setError("Please enter your full street address, city, and ZIP code.");
      return;
    }

    setLoading(true);
    setError(null);

    submittingRef.current = true;

    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      // 1) Save appointment
      const apptRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "appointments"
      );
      console.log("1) Writing appointment...");
      const saved = doc(apptRef);
      const access = await createManagementAccess(saved.id);
      await setDoc(saved, {
        ...access,
        ...formData,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      setRequestId(saved.id);
      setManagementUrl(access.managementUrl);
      // Once saved, never invite a second booking because notification delivery failed.
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const [customerTpl, businessTpl] = await Promise.all([
          fetchTemplate("appointment_confirmation"), fetchTemplate("business_alert"),
        ]);
        const mailRef = collection(db, "artifacts", appId, "public", "data", "mail");
        const batch = writeBatch(db);
        batch.set(doc(mailRef, `${saved.id}-customer`), {
          to: formData.email,
          replyTo: SUPPORT_EMAIL,
          message: appointmentMessage({ ...formData, ...access, reference: saved.id }, customerTpl),
        });
        BUSINESS_EMAILS.forEach((email, index) => {
          batch.set(doc(mailRef, `${saved.id}-business-${index}`), {
            to: email,
            replyTo: formData.email,
            message: appointmentMessage(formData, businessTpl, true),
          });
        });
        await batch.commit();
      } catch (mailError) {
        console.warn("Appointment saved, but email queue failed:", mailError);
        setEmailWarning(true);
      }
    } catch (err) {
      console.error("Submission Error:", err);
      setError(`Failed to submit: ${err.message}`);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#050505] flex justify-center px-4 py-12 sm:py-16 font-sans">
        <div className="max-w-3xl w-full min-w-0 bg-[#0a0a0a] border border-blue-500/30 p-6 sm:p-10 rounded-3xl text-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter">
            Request Sent
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Your request is saved and awaiting confirmation. We will review your details and contact you by email or phone to confirm the appointment.
          </p>
          <div className="text-left mb-8">
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2">Pending confirmation</p>
            <p className="text-xs text-gray-400 break-all mb-6">Request reference: {requestId}</p>
            <a href={managementUrl} className="inline-block mb-6 text-blue-300 underline">View or cancel your appointment</a>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-y border-white/10 py-6 text-sm">
              {[
                ["Requested date", new Date(`${formData.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })],
                ["Requested time", `${formData.timeSlot} Pacific time`],
                ["Name", formData.name], ["Email", formData.email],
                ["Phone", formData.phone], ["Service address", formData.address],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-gray-400 mb-1">{label}</dt>
                  <dd className="text-white break-words">{value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2 min-w-0">
                <dt className="text-gray-400 mb-1">Issue details</dt>
                <dd className="text-white whitespace-pre-wrap break-words">{formData.description}</dd>
              </div>
            </dl>
            {emailWarning && <p role="status" className="text-amber-200 text-sm mt-6">Your request is saved, but we could not queue the notification emails. Please contact support with your request reference. You do not need to submit again.</p>}
            <p className="text-gray-400 text-sm mt-6">Need to change your request? Email <a href="mailto:support@vallejotech.org" className="text-blue-400 underline break-all">support@vallejotech.org</a> and include your request reference.</p>
          </div>
          <button
            onClick={() =>
              setPage ? setPage("home") : (window.location.href = "/")
            }
            className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 border-l-4 border-blue-600 pl-6">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
            Schedule <span className="text-blue-600">Service</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mt-2">
            Vallejo Tech // Appointment Scheduling
          </p>
        </header>

        {mapsError && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-200 text-xs font-medium">
            Address suggestions are unavailable right now. You can still type your address manually.

          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-[#0a0a0a] border border-white/5 p-8 md:p-10 rounded-3xl shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500/50 focus:outline-none transition-all"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500/50 focus:outline-none transition-all"
                  placeholder="email@address.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input
                  type="tel"
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500/50 focus:outline-none transition-all"
                  placeholder="(707) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input
                  key={mapsError ? "manual-address" : "autocomplete-address"}
                  ref={addressInputRef}
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500/50 focus:outline-none transition-all"
                  autoComplete="street-address"
                  placeholder="Street address, city, ZIP code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 px-6 focus:border-blue-500/50 focus:outline-none transition-all text-sm"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value, timeSlot: "" })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex justify-between">
                <span>Time Slot</span>
                {checkingAvailability && <Loader2 className="animate-spin text-blue-500" size={12} />}
              </label>
              <select
                required
                disabled={!formData.date || checkingAvailability}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 px-6 focus:border-blue-500/50 focus:outline-none transition-all text-sm appearance-none"
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              >
                <option value="">Select Time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot} disabled={bookedSlots.includes(slot)}>
                    {slot} {bookedSlots.includes(slot) ? "(Booked)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
              Description of Issue
            </label>
            <textarea
              required
              rows="4"
              className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 px-6 focus:border-blue-500/50 focus:outline-none transition-all text-sm"
              placeholder="Please describe what's wrong with your device..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.timeSlot}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Submit Appointment Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SchedulingPage;
