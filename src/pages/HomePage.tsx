import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Search, FileWarning, AlertTriangle, Phone, Globe, TrendingUp, Clock, MapPin, ChevronRight, Radio } from "lucide-react";

export default function HomePage() {
  const { data: stats } = trpc.report.stats.useQuery();

  const typeLabels: Record<string, string> = {
    investment_scam: "Investment Scam",
    bank_impersonation: "Bank Impersonation",
    crypto_scam: "Crypto Scam",
    police_threat: "Police Threat",
    phishing: "Phishing",
    harassment: "Harassment",
    spam: "Spam",
    other: "Other",
  };

  const typeColors: Record<string, string> = {
    investment_scam: "text-blue-700 bg-blue-50 border-blue-200",
    bank_impersonation: "text-emerald-700 bg-emerald-50 border-emerald-200",
    crypto_scam: "text-purple-700 bg-purple-50 border-purple-200",
    police_threat: "text-red-700 bg-red-50 border-red-200",
    phishing: "text-amber-700 bg-amber-50 border-amber-200",
    harassment: "text-orange-700 bg-orange-50 border-orange-200",
    spam: "text-slate-600 bg-slate-50 border-slate-200",
    other: "text-gray-600 bg-gray-50 border-gray-200",
  };

  const countries = [
    { name: "Czechia", code: "CZ", flag: "🇨🇿", reports: stats?.byCountry.find(c => c.country === "Czechia")?.count || 0 },
    { name: "Slovakia", code: "SK", flag: "🇸🇰", reports: stats?.byCountry.find(c => c.country === "Slovakia")?.count || 0 },
    { name: "United Kingdom", code: "UK", flag: "🇬🇧", reports: stats?.byCountry.find(c => c.country === "United Kingdom")?.count || 0 },
    { name: "Germany", code: "DE", flag: "🇩🇪", reports: stats?.byCountry.find(c => c.country === "Germany")?.count || 0 },
    { name: "Netherlands", code: "NL", flag: "🇳🇱", reports: stats?.byCountry.find(c => c.country === "Netherlands")?.count || 0 },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="py-14 lg:py-20 bg-white border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 mb-6">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span className="text-xs font-semibold text-amber-700 tracking-wide uppercase">Live OSINT Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight text-slate-900 leading-tight">
            Global Cybercrime<br />
            <span className="text-amber-600">Intelligence Platform</span>
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Real-time scam number tracking, community-driven reporting, and open-source intelligence
            across five European jurisdictions. Every data point verified. Nothing fabricated.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/check" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 shadow-sm hover:shadow-md transition-all">
              <Search className="w-4 h-4" /> Lookup Number
            </Link>
            <Link to="/report" className="inline-flex items-center gap-2 glass hover:bg-white text-slate-900 font-semibold px-6 py-3 transition-all">
              <FileWarning className="w-4 h-4 text-amber-600" /> Submit Report
            </Link>
            <Link to="/map" className="inline-flex items-center gap-2 glass hover:bg-white text-slate-900 font-semibold px-6 py-3 transition-all">
              <MapPin className="w-4 h-4 text-amber-600" /> View Map
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Phone, label: "Total Reports", value: stats?.total || 0, color: "text-red-600" },
              { icon: TrendingUp, label: "Today", value: stats?.today || 0, color: "text-amber-600" },
              { icon: AlertTriangle, label: "High Danger", value: stats?.highDanger || 0, color: "text-red-600" },
              { icon: Globe, label: "Jurisdictions", value: stats?.byCountry?.length || 0, color: "text-blue-600" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-5 text-center">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-600" />
            Active Jurisdictions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {countries.map((c) => (
              <Link key={c.code} to={`/dashboard?country=${encodeURIComponent(c.name)}`}
                className="glass-card p-4 text-center hover:border-amber-300 transition-all">
                <div className="text-2xl mb-1">{c.flag}</div>
                <div className="text-sm font-bold text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.reports} reports</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Scam Types */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Threat Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats?.byType?.map((t) => (
              <div key={t.type} className={`glass-card p-4 border ${typeColors[t.type]?.split(' ').pop() || 'border-slate-200'}`}>
                <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block mb-2 ${typeColors[t.type] || 'text-gray-700 bg-gray-50'}`}>
                  {typeLabels[t.type] || t.type}
                </div>
                <div className="text-xl font-bold text-slate-900">{t.count}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">reports</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reports */}
      <section className="py-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Latest Intelligence
            </h2>
            <Link to="/dashboard" className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.latest?.map((report) => (
              <div key={report.id} className="glass-card p-4 hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-mono font-bold text-sm text-slate-900">{report.phoneNumber}</span>
                    <span className="text-xs text-slate-500">{report.country}</span>
                    {report.carrier && <span className="text-xs text-slate-400">{report.carrier}</span>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColors[report.reportType] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                    {typeLabels[report.reportType] || report.reportType}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{report.description}</p>
                {report.dangerRating && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-20 bg-slate-200 rounded-sm h-1.5">
                      <div className="h-1.5 bg-red-500" style={{ width: `${report.dangerRating}%` }} />
                    </div>
                    <span className="text-xs font-bold text-red-600">{report.dangerRating}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
