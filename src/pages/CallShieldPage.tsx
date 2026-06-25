import { useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { Shield, Phone, PhoneOff, AlertTriangle, CheckCircle, XCircle, Zap, Activity, Globe, Clock, Settings, Play, RotateCcw } from "lucide-react";

type Verdict = "safe" | "caution" | "warning" | "danger";

const verdictColors: Record<Verdict, { bg: string; border: string; text: string; icon: string; accent: string }> = {
  safe: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", icon: "text-emerald-600", accent: "bg-emerald-500" },
  caution: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", icon: "text-amber-600", accent: "bg-amber-500" },
  warning: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", icon: "text-orange-600", accent: "bg-orange-500" },
  danger: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", icon: "text-red-600", accent: "bg-red-500" },
};

const verdictLabels: Record<Verdict, string> = {
  safe: "Safe",
  caution: "Caution",
  warning: "Warning",
  danger: "Scam Detected",
};

interface CheckResult {
  number: string;
  verdict: Verdict;
  score: number;
  time: string;
}

export default function CallShieldPage() {
  const [shieldEnabled, setShieldEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [recentChecks, setRecentChecks] = useState<CheckResult[]>([]);

  const checkMutation = trpc.callShield.incomingCallCheck.useMutation();

  const simulateIncomingCall = useCallback(() => {
    if (!phoneNumber.trim()) return;
    setIsSimulating(true);
    setShowCallScreen(true);

    checkMutation.mutate(
      { phoneNumber: phoneNumber.trim() },
      {
        onSettled: () => {
          setIsSimulating(false);
        },
      }
    );
  }, [phoneNumber, checkMutation]);

  const dismissCall = () => {
    setShowCallScreen(false);
    if (checkMutation.data) {
      const v = checkMutation.data.verdict as Verdict;
      setRecentChecks((prev) => [
        { number: checkMutation.data!.phoneNumber, verdict: v, score: checkMutation.data!.riskScore, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
    }
    checkMutation.reset();
  };

  const result = checkMutation.data;
  const colors: typeof verdictColors.safe = result ? verdictColors[result.verdict as Verdict] : verdictColors.safe;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Call Shield</h1>
        <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
          Real-time call screening. Every incoming number is instantly checked against the ScamWatch database before you pick up.
        </p>
      </div>

      {/* Shield Toggle */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${shieldEnabled ? "bg-red-50" : "bg-slate-100"}`}>
              <Zap className={`w-5 h-5 ${shieldEnabled ? "text-red-600" : "text-slate-400"}`} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">Call Protection</div>
              <div className="text-xs text-slate-500">
                {shieldEnabled ? "Active — all calls screened" : "Disabled — no screening"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShieldEnabled(!shieldEnabled)}
            className={`relative w-14 h-7 rounded-full transition-all ${shieldEnabled ? "bg-red-500" : "bg-slate-300"}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${shieldEnabled ? "left-7" : "left-0.5"}`} />
          </button>
        </div>

        {shieldEnabled && (
          <div className="mt-4 pt-4 border-t border-black/[0.06]">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Activity className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">How it works:</span> When your phone receives a call, ScamWatch checks the number against our database in real-time (typically &lt;50ms). If it&apos;s a known scam, you get a warning before you answer.
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600 mt-2">
              <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Integration:</span> Connect via webhook URL, browser extension, or mobile app. For now, use the simulator below to test how it works.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulator */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-red-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Incoming Call Simulator</h2>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && simulateIncomingCall()}
              placeholder="Enter a phone number (e.g. +420 770 135 902)"
              className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={simulateIncomingCall}
            disabled={!phoneNumber.trim() || isSimulating}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold px-5 py-2.5 text-sm shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
          >
            {isSimulating ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Checking...</>
            ) : (
              <><Phone className="w-4 h-4" /> Simulate</>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-2">
          Try: <button onClick={() => setPhoneNumber("+420 770 135 902")} className="text-red-500 hover:underline">+420 770 135 902</button>{" | "}
          <button onClick={() => setPhoneNumber("+44 7903 562891")} className="text-red-500 hover:underline">+44 7903 562891</button>{" | "}
          <button onClick={() => setPhoneNumber("+1 555 123 4567")} className="text-red-500 hover:underline">+1 555 123 4567</button>{" | "}
          <button onClick={() => setPhoneNumber("+49 1573 8892100")} className="text-red-500 hover:underline">+49 1573 8892100</button>
        </p>
      </div>

      {/* Incoming Call Screen Overlay */}
      {showCallScreen && result && (
        <div className="mb-6">
          <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl overflow-hidden`}>
            <div className="bg-black/[0.04] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className={`w-4 h-4 ${colors.icon}`} />
                <span className="text-xs font-medium text-slate-500">Incoming Call</span>
              </div>
              <span className="text-[10px] text-slate-400">{result.detectedCountry}</span>
            </div>

            <div className="px-6 py-5 text-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${colors.bg} ${colors.border} border ${colors.text}`}>
                {result.verdict === "safe" ? <CheckCircle className="w-3.5 h-3.5" /> :
                 result.verdict === "danger" ? <XCircle className="w-3.5 h-3.5" /> :
                 <AlertTriangle className="w-3.5 h-3.5" />}
                {verdictLabels[result.verdict as Verdict]}
              </div>

              <div className="text-2xl font-bold text-slate-900 mb-1">{result.phoneNumber}</div>

              <div className="max-w-xs mx-auto mb-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Safe</span>
                  <span>Risk: {result.riskScore}%</span>
                  <span>Danger</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colors.accent}`}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>
              </div>

              <p className={`text-sm ${colors.text} mb-3 max-w-sm mx-auto`}>{result.reason}</p>

              {result.matchedReports.length > 0 && (
                <div className="text-left bg-white/50 rounded-lg p-3 mb-3 max-w-sm mx-auto">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Matched Reports</div>
                  {result.matchedReports.slice(0, 3).map((r: { reportType: string; dangerRating: number | null; reportedAt: Date }, i: number) => (
                    <div key={i} className="text-xs text-slate-700 py-1 border-b border-black/[0.04] last:border-0">
                      <span className="font-medium">{r.reportType.replace(/_/g, " ")}</span>
                      {r.dangerRating !== null && <span className="text-red-500 ml-1">({r.dangerRating}%)</span>}
                      <span className="text-slate-400 ml-1">&middot; {new Date(r.reportedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={dismissCall}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm shadow-sm transition-all"
                >
                  <PhoneOff className="w-4 h-4" />
                  Decline
                </button>
                <button
                  onClick={dismissCall}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-full text-sm shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Answer Anyway
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {result.responseTimeMs}ms check</span>
                <span className="flex items-center gap-1"><Settings className="w-3 h-3" /> ScamWatch DB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Guide */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" />
          Integration Guide
        </h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs font-bold text-red-600">1</div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Webhook URL</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Point your phone system or app to <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">POST /api/trpc/callShield.incomingCallCheck</code> with{" "}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">{"{phoneNumber: \"+1234567890\"}"}</code>. Returns verdict in &lt;50ms.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs font-bold text-red-600">2</div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Android App (Future)</div>
              <p className="text-xs text-slate-600 mt-0.5">
                An Android app using <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">TelecomManager</code> can intercept incoming calls, query ScamWatch API, and overlay a warning before the user answers.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs font-bold text-red-600">3</div>
            <div>
              <div className="text-sm font-semibold text-slate-900">iOS Shortcuts</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Create an iOS Shortcut automation that triggers on incoming calls, sends the number to ScamWatch, and displays a notification with the verdict.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs font-bold text-red-600">4</div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Browser Extension</div>
              <p className="text-xs text-slate-600 mt-0.5">
                A browser extension can warn you when scam numbers appear on websites (classifieds, marketplaces) before you even dial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Checks */}
      {recentChecks.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Recent Checks
            </h2>
            <button onClick={() => setRecentChecks([])} className="text-xs text-slate-400 hover:text-red-600">Clear</button>
          </div>
          <div className="space-y-2">
            {recentChecks.map((check: CheckResult, i: number) => {
              const c = verdictColors[check.verdict];
              return (
                <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg ${c.bg} border ${c.border}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${c.accent}`} />
                    <span className="text-sm font-medium text-slate-900">{check.number}</span>
                    <span className={`text-xs font-bold ${c.text}`}>{verdictLabels[check.verdict]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{check.score}% risk</span>
                    <span className="text-[10px] text-slate-400">{check.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
