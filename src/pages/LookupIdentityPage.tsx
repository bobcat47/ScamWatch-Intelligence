import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import { Search, ShieldAlert, ShieldCheck, Database, AlertTriangle, Calendar, FileText, User, Mail, LogIn } from "lucide-react";

export default function LookupIdentityPage() {
  const [identity, setIdentity] = useState("");
  const [searched, setSearched] = useState(false);

  const { data, isLoading } = trpc.identity.lookup.useQuery(
    { identity },
    { enabled: searched && identity.length >= 2 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (identity.length >= 2) setSearched(true);
  };

  const exampleIdentities = [
    "john.smith", "johnsmith", "mike2020", "sarah.jones",
    "david_wilson", "alex.m", "emma_brown", "chris_92",
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <Database className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">Identity Breach Lookup</h1>
        <p className="text-slate-600 text-sm mt-2">
          Check if your username, real name, or email has appeared in known data breaches.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={identity}
              onChange={(e) => { setIdentity(e.target.value); setSearched(false); }}
              placeholder="Enter username, name, or email..."
              className="w-full pl-10 pr-4 py-3 glass-input outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || identity.length < 2}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold px-6 py-3 shadow-sm transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Lookup
          </button>
        </div>
      </form>

      {/* Examples */}
      {!searched && (
        <div className="mb-8">
          <p className="text-xs text-slate-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleIdentities.map((ex) => (
              <button
                key={ex}
                onClick={() => { setIdentity(ex); setSearched(true); }}
                className="text-xs glass px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:border-amber-300 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA to monitor */}
      {!searched && (
        <div className="glass-card p-6 text-center border-amber-200">
          <Mail className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-2">Get Notified of Future Breaches</h3>
          <p className="text-sm text-slate-600 mb-4">
            Create a free account to save your identities. We'll check them regularly and email you if they appear in new breaches.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 text-sm shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" /> Create Account
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Checking breach databases...</p>
        </div>
      )}

      {searched && !isLoading && data && (
        <div>
          {/* Result banner */}
          {data.found ? (
            <div className="glass-card border-red-300 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-8 h-8 text-red-600" />
                <div>
                  <h2 className="text-lg font-bold text-red-700">BREACHES FOUND</h2>
                  <p className="text-sm text-red-600">
                    "{data.identity}" appeared in {data.breachCount} known data breach{data.breachCount !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>
              {data.disclaimer && (
                <p className="text-[11px] text-slate-500 mb-3 bg-amber-50 p-2 border border-amber-200">{data.disclaimer}</p>
              )}
            </div>
          ) : (
            <div className="glass-card border-emerald-300 p-6 mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-bold text-emerald-700">No Breaches Found</h2>
                  <p className="text-sm text-emerald-600">
                    "{data.identity}" was not found in our current breach database.
                  </p>
                </div>
              </div>
              {data.disclaimer && (
                <p className="text-[11px] text-slate-500 mt-3 bg-amber-50 p-2 border border-amber-200">{data.disclaimer}</p>
              )}
            </div>
          )}

          {/* Breach details */}
          {data.breaches.length > 0 && (
            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Breach Details
              </h3>
              {data.breaches.map((breach, idx) => (
                <div key={idx} className="glass-card p-4 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">{breach.name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" /> {breach.date}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{breach.description}</p>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">Data exposed: {breach.dataClasses.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monitor CTA */}
          <div className="glass-card p-6 text-center border-amber-200">
            <Mail className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Monitor "{data.identity}"</h3>
            <p className="text-sm text-slate-600 mb-4">
              Create an account to save this identity. We'll automatically check it against new breaches and notify you.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 text-sm shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4" /> Create Account to Monitor
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
