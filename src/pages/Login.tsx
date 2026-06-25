import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import { LogIn, Mail, Lock, User, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("local_auth_token", data.token);
      setSuccess("Signed in successfully! Redirecting...");
      window.location.href = "/account";
    },
    onError: (err) => setError(err.message),
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("local_auth_token", data.token);
      setSuccess("Account created! Redirecting...");
      window.location.href = "/account";
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      registerMutation.mutate({ email, password, name });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Shield className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          {mode === "login"
            ? "Access your breach monitoring dashboard"
            : "Start monitoring your identities for breaches"}
        </p>
      </div>

      {/* Kimi OAuth */}
      <a
        href={`/api/oauth/authorize?redirect=${encodeURIComponent(window.location.origin + "/account")}`}
        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 shadow-sm transition-all mb-4"
      >
        <LogIn className="w-4 h-4" />
        Sign in with Kimi
      </a>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-300" />
        <span className="text-xs text-slate-400 font-medium uppercase">or use email</span>
        <div className="flex-1 h-px bg-slate-300" />
      </div>

      {/* Local auth form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Smith"
              className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Password *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
            className="w-full px-4 py-2.5 glass-input outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold py-3 shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          {isPending ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Please wait...</>
          ) : mode === "login" ? (
            <><LogIn className="w-4 h-4" /> Sign In</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> Create Account</>
          )}
        </button>
      </form>

      {/* Toggle mode */}
      <div className="text-center mt-5">
        {mode === "login" ? (
          <p className="text-sm text-slate-600">
            No account?{" "}
            <button onClick={() => { setMode("register"); setError(""); }} className="text-red-600 font-semibold hover:text-red-700">
              Create one
            </button>
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <button onClick={() => { setMode("login"); setError(""); }} className="text-red-600 font-semibold hover:text-red-700">
              Sign in
            </button>
          </p>
        )}
      </div>

      <div className="text-center mt-4">
        <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
          Back to home
        </Link>
      </div>
    </div>
  );
}
