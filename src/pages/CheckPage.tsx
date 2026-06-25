import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Search, Phone, AlertTriangle, ShieldCheck, ShieldAlert, Globe, FileWarning } from "lucide-react";

export default function CheckPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searched, setSearched] = useState(false);

  const { data, isLoading, refetch } = trpc.report.check.useQuery(
    { phoneNumber }, { enabled: searched && phoneNumber.length >= 5 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 5) { setSearched(true); refetch(); }
  };

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <Search className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">Number Lookup</h1>
        <p className="text-slate-600 text-sm mt-2">Search our intelligence database for reported scam numbers.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setSearched(false); }}
              placeholder="+420 770 135 963 or 770135963"
              className="w-full pl-10 pr-4 py-3 glass-input outline-none text-slate-900 placeholder:text-slate-400" />
          </div>
          <button type="submit" disabled={isLoading || phoneNumber.length < 5}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold px-6 py-3 shadow-sm transition-all flex items-center gap-2">
            <Search className="w-4 h-4" /> Check
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-3 border-red-200 border-t-red-600 animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Searching intelligence database...</p>
        </div>
      )}

      {searched && !isLoading && data && (
        <div>
          {data.found ? (
            <div className="glass-card border-red-300 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-8 h-8 text-red-600" />
                <div>
                  <h2 className="text-lg font-bold text-red-700">THREAT CONFIRMED</h2>
                  <p className="text-sm text-red-600">{data.count} report{data.count !== 1 ? "s" : ""} on file{data.maxDanger > 0 ? ` — Max danger: ${data.maxDanger}%` : ""}</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-slate-800">
                  <strong className="text-red-700">Do not call back.</strong> This number is confirmed as part of an active scam operation. Block immediately and warn your contacts.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card border-emerald-300 p-6 mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-bold text-emerald-700">No Threats Found</h2>
                  <p className="text-sm text-emerald-600">Not in our database — but stay cautious. Scammers use new numbers constantly.</p>
                </div>
              </div>
            </div>
          )}

          {data.reports.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileWarning className="w-4 h-4" /> Report Details
              </h3>
              <div className="space-y-3">
                {data.reports.map((report) => (
                  <div key={report.id} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-mono font-bold text-sm text-slate-900">{report.phoneNumber}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500"><Globe className="w-3 h-3" />{report.country}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColors[report.reportType] || ""}`}>
                        {typeLabels[report.reportType] || report.reportType}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{report.description}</p>
                    {report.dangerRating && (
                      <div className="mt-2 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <div className="w-16 bg-slate-200 h-1.5"><div className="h-1.5 bg-red-500" style={{ width: `${report.dangerRating}%` }} /></div>
                        <span className="text-xs font-bold text-red-600">{report.dangerRating}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
