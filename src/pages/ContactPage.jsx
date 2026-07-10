import React from "react";
import GlassCard from "../components/GlassCard";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="py-16 max-w-4xl mx-auto px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
          Contact <span className="text-blue-600">Vallejo Tech</span>
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Reach out anytime. Appointments and consultations are always free.
        </p>
      </div>

      {/* Contact Card */}
      <GlassCard className="p-8 md:p-10 space-y-8">
        {/* Phone */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
              Call or Text
            </p>
            <p className="text-lg font-black text-white tracking-tight">
              (707) 277-1006
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-1">
              Fastest way to reach us. If you book online, we’ll follow up to
              confirm details.
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
              Email
            </p>
            <p className="text-lg font-black text-white break-all">
              support@vallejotech.org
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-1">
              Ideal for sending photos, error messages, or a detailed
              description of the issue.
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
              Location & Service Area
            </p>
            <p className="text-lg font-black text-white">Vallejo, CA 94591</p>
            <p className="text-gray-400 text-sm leading-relaxed mt-1">
              Serving all of{" "}
              <span className="text-white font-bold">Solano County</span>, with
              exceptions made for nearby areas depending on the job.
            </p>
          </div>
        </div>

        {/* Hours */}
        <div className="pt-6 border-t border-white/10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="w-full">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Business Hours
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-1">
                <span className="text-gray-300">Monday – Saturday</span>
                <span className="text-white font-bold">9:00 AM – 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sunday</span>
                <span className="text-gray-500 font-black uppercase text-xs">
                  Closed
                </span>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mt-3">
              Messages received after hours will be answered the next business
              day.
            </p>
          </div>
        </div>

        {/* Trust Statements */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <p className="text-center text-sm text-gray-300 font-medium">
            ✔ Appointment and consultation are{" "}
            <span className="text-white font-black">100% free</span>
          </p>
          <p className="text-center text-sm text-gray-300 font-medium">
            ✔ If we cannot repair it,{" "}
            <span className="text-white font-black">you pay nothing</span>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
