import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { FileWarning, CheckCircle, Phone, Globe, Signal, MessageSquare, Gauge, Upload, Mic, AlertTriangle } from "lucide-react";

const reportTypes = [
  { value: "investment_scam", label: "Investment Scam" },
  { value: "bank_impersonation", label: "Bank Impersonation" },
  { value: "crypto_scam", label: "Crypto Scam" },
  { value: "police_threat", label: "Police / Authority Threat" },
  { value: "phishing", label: "Phishing (Email/SMS/Link)" },
  { value: "harassment", label: "Harassment / Repeated Calls" },
  { value: "spam", label: "Spam / Unsolicited" },
  { value: "other", label: "Other Fraud" },
];

const countries = ["Czechia", "Slovakia", "United Kingdom", "Germany", "Netherlands", "Other"];

// Approximate bounding boxes for coordinate generation (lat, lng ranges)
const countryBounds: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  Czechia: { latMin: 48.55, latMax: 51.05, lngMin: 12.1, lngMax: 18.85 },
  Slovakia: { latMin: 47.75, latMax: 49.6, lngMin: 16.85, lngMax: 22.55 },
  "United Kingdom": { latMin: 49.9, latMax: 58.7, lngMin: -6.3, lngMax: 1.8 },
  Germany: { latMin: 47.25, latMax: 55.1, lngMin: 5.85, lngMax: 15.05 },
  Netherlands: { latMin: 50.75, latMax: 53.5, lngMin: 3.35, lngMax: 7.2 },
  Other: { latMin: 35.0, latMax: 60.0, lngMin: -10.0, lngMax: 30.0 },
};

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getCoordsForCountry(country: string) {
  const bounds = countryBounds[country] || countryBounds.Other;
  return {
    latitude: randomInRange(bounds.latMin, bounds.latMax).toFixed(6),
    longitude: randomInRange(bounds.lngMin, bounds.lngMax).toFixed(6),
  };
}

export default function ReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    phoneNumber: "", country: "Czechia", carrier: "", description: "",
    reportType: "investment_scam" as const, dangerRating: 50,
    latitude: "", longitude: "",
    evidenceUrl: "", callRecordingUrl: "",
  });

  const submitMutation = trpc.report.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setForm({ phoneNumber: "", country: "Czechia", carrier: "", description: "", reportType: "investment_scam", dangerRating: 50, latitude: "", longitude: "", evidenceUrl: "", callRecordingUrl: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phoneNumber.length >= 5 && form.description.length >= 10) {
      // Auto-generate coordinates if not set
      const payload = { ...form };
      if (!payload.latitude || !payload.longitude) {
        const coords = getCoordsForCountry(payload.country);
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }
      submitMutation.mutate(payload);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="glass-card p-10">
          <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted</h2>
          <p className="text-slate-600 text-sm mb-6">Your intelligence has been added to the live database and is now visible to the community.</p>
          <button onClick={() => setSubmitted(false)} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 text-sm shadow-sm transition-all">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <FileWarning className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">Submit Intelligence Report</h1>
        <p className="text-slate-600 text-sm mt-2">All submissions are public and immediately visible. Be factual and specific.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Phone Number *
          </label>
          <input type="text" required minLength={5} value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="+420 770 135 963"
            className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Country *
            </label>
            <select value={form.country} onChange={(e) => {
                const country = e.target.value;
                const coords = getCoordsForCountry(country);
                setForm({ ...form, country, latitude: coords.latitude, longitude: coords.longitude });
              }}
              className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 appearance-none bg-white/60">
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" /> Carrier
            </label>
            <input type="text" value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              placeholder="Vodafone CZ, O2..." className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Scam Type *
          </label>
          <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value as typeof form.reportType })}
            className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 appearance-none bg-white/60">
            {reportTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" /> Danger Level: <span className="text-slate-900">{form.dangerRating}%</span>
          </label>
          <input type="range" min={0} max={100} value={form.dangerRating}
            onChange={(e) => setForm({ ...form, dangerRating: Number(e.target.value) })}
            className="w-full accent-red-600 h-1.5 bg-slate-300 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Safe</span><span>Moderate</span><span>Extreme</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> What happened? *
          </label>
          <textarea required minLength={10} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the call: what they said, their accent, what they wanted, any threats..."
            rows={4} className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400 resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Screenshot URL
            </label>
            <input type="url" value={form.evidenceUrl}
              onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
              placeholder="https://imgur.com/..." className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Recording URL
            </label>
            <input type="url" value={form.callRecordingUrl}
              onChange={(e) => setForm({ ...form, callRecordingUrl: e.target.value })}
              placeholder="https://..." className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400" />
          </div>
        </div>

        <button type="submit" disabled={submitMutation.isPending}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold py-3 shadow-sm flex items-center justify-center gap-2 transition-all">
          {submitMutation.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : <><FileWarning className="w-4 h-4" />Submit Report</>}
        </button>

        {submitMutation.isError && (
          <div className="glass border-red-300 p-3 text-sm text-red-700">Error submitting. Please try again.</div>
        )}
      </form>
    </div>
  );
}
