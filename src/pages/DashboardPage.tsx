import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { LayoutDashboard, Search, Filter, AlertTriangle, Phone, Globe, Gauge, Clock, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading, refetch } = trpc.report.list.useQuery({
    search: search || undefined, country: countryFilter || undefined,
    reportType: typeFilter || undefined, limit: 100,
  });

  useEffect(() => {
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const typeLabels: Record<string, string> = {
    investment_scam: "Investment", bank_impersonation: "Bank Impersonation",
    crypto_scam: "Crypto", police_threat: "Police Threat",
    phishing: "Phishing", harassment: "Harassment", spam: "Spam", other: "Other",
  };
  const typeColors: Record<string, string> = {
    investment_scam: "text-blue-700 bg-blue-50 border-blue-200",
    bank_impersonation: "text-emerald-700 bg-emerald-50 border-emerald-200",
    crypto_scam: "text-purple-700 bg-purple-50 border-purple-200",
    police_threat: "text-red-700 bg-red-50 border-red-200",
    phishing: "text-amber-700 bg-amber-50 border-amber-200",
    harassment: "text-orange-700 bg-orange-50 border-orange-200",
    spam: "text-slate-600 bg-slate-50 border-slate-200",
    other: "text-gray-700 bg-gray-50 border-gray-200",
  };

  const reportTypes = [{ value: "", label: "All Types" }, ...Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))];
  const countries = ["", "Czechia", "Slovakia", "United Kingdom", "Germany", "Netherlands"];

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-amber-600" />
          <h1 className="text-xl font-bold text-slate-900">Intelligence Database</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} /> Live
        </div>
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search number..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 glass-input outline-none text-slate-900 text-sm placeholder:text-slate-400" />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 glass-input outline-none text-slate-900 text-sm appearance-none bg-white/60">
              {countries.map((c) => <option key={c || "all"} value={c}>{c || "All Countries"}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 glass-input outline-none text-slate-900 text-sm appearance-none bg-white/60">
              {reportTypes.map((t) => <option key={t.value || "all"} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">{data?.total || 0} record{data?.total !== 1 ? "s" : ""} found</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Loading intelligence...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.reports.map((report) => (
            <div key={report.id} className="glass-card p-4 hover:border-amber-300 transition-all">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-mono font-bold text-sm text-slate-900">{report.phoneNumber}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500"><Globe className="w-3 h-3" />{report.country}</span>
                  {report.carrier && <span className="text-xs text-slate-400">{report.carrier}</span>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColors[report.reportType] || ""}`}>
                  {typeLabels[report.reportType] || report.reportType}
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-2">{report.description}</p>
              <div className="flex items-center gap-4 flex-wrap">
                {report.dangerRating !== null && report.dangerRating > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <div className="w-16 bg-slate-200 h-1.5"><div className="h-1.5 bg-red-500" style={{ width: `${report.dangerRating}%` }} /></div>
                    <span className="text-xs font-bold text-red-600">{report.dangerRating}%</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" />{formatDate(report.reportedAt)}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500"><Gauge className="w-3 h-3" />ID:{report.id}</div>
              </div>
              {(report.evidenceUrl || report.callRecordingUrl) && (
                <div className="flex gap-3 mt-2">
                  {report.evidenceUrl && <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 hover:text-red-700 font-semibold">Evidence</a>}
                  {report.callRecordingUrl && <a href={report.callRecordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 hover:text-red-700 font-semibold">Recording</a>}
                </div>
              )}
            </div>
          ))}
          {data?.reports.length === 0 && (
            <div className="text-center py-12 glass-card">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No records match your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
