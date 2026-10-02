import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";

export default function AppointmentDetails({ appointment }) {
  return <>
    <dl className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-sm">
      <div className="min-w-0">
        <dt className="flex items-center gap-2 text-gray-400 mb-2"><Phone size={16} /> Phone</dt>
        <dd>{appointment.phone ? <a className="text-lg font-semibold text-blue-300 hover:underline" href={`tel:${appointment.phone.replace(/[^+\d]/g, "")}`}>{appointment.phone}</a> : "Not provided"}</dd>
      </div>
      <div className="min-w-0">
        <dt className="flex items-center gap-2 text-gray-400 mb-2"><Mail size={16} /> Email</dt>
        <dd className="break-words">{appointment.email ? <a className="text-blue-300 hover:underline" href={`mailto:${appointment.email}`}>{appointment.email}</a> : "Not provided"}</dd>
      </div>
      <div className="lg:col-span-2 min-w-0">
        <dt className="flex items-center gap-2 text-gray-400 mb-2"><MapPin size={16} /> Service address</dt>
        <dd className="text-gray-100 break-words">{appointment.address || "Not provided"}</dd>
      </div>
    </dl>
    <div className="mt-6 p-4 bg-black/30 border border-white/10 rounded-xl">
      <h4 className="text-sm font-semibold text-gray-400 mb-2">Issue details</h4>
      <p className="text-base text-gray-100 whitespace-pre-wrap break-words">{appointment.description || "No details provided"}</p>
    </div>
  </>;
}
