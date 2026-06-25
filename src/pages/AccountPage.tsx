import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import {
  User, Shield, Bell, Trash2, Plus, LogIn,
  Database, AlertTriangle, CheckCircle, UserCheck,
} from "lucide-react";

export default function AccountPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [newIdentity, setNewIdentity] = useState("");
  const [newType, setNewType] = useState<"username" | "real_name" | "email">("username");
  const [newLabel, setNewLabel] = useState("");

  const utils = trpc.useUtils();

  const { data: stats } = trpc.identity.alertStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: monitored } = trpc.identity.myMonitored.useQuery(undefined, { enabled: isAuthenticated });
  const { data: alerts } = trpc.identity.myAlerts.useQuery(undefined, { enabled: isAuthenticated });

  const monitorMutation = trpc.identity.monitor.useMutation({
    onSuccess: () => {
      setNewIdentity("");
      setNewLabel("");
      utils.identity.myMonitored.invalidate();
      utils.identity.alertStats.invalidate();
    },
  });

  const removeMutation = trpc.identity.removeMonitor.useMutation({
    onSuccess: () => {
      utils.identity.myMonitored.invalidate();
      utils.identity.alertStats.invalidate();
      utils.identity.myAlerts.invalidate();
    },
  });

  const markReadMutation = trpc.identity.markAlertRead.useMutation({
    onSuccess: () => utils.identity.myAlerts.invalidate(),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIdentity.trim()) {
      monitorMutation.mutate({
        identityType: newType,
        identityValue: newIdentity.trim(),
        label: newLabel.trim() || undefined,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
        <p className="text-slate-500 mt-3">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="glass-card p-10">
          <LogIn className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-600 text-sm mb-6">
            Create an account to monitor your identities and receive breach alerts.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 shadow-sm transition-all">
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-200 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-slate-500" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{user?.name || "Account"}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 border border-red-200 hover:bg-red-50 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <Database className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">{stats?.monitoredCount || 0}</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider">Monitored</div>
        </div>
        <div className="glass-card p-4 text-center">
          <Bell className="w-5 h-5 text-amber-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">{stats?.totalAlerts || 0}</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider">Total Alerts</div>
        </div>
        <div className="glass-card p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900">{stats?.unreadAlerts || 0}</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider">Unread</div>
        </div>
      </div>

      {/* Add Identity */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Monitor a New Identity
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as typeof newType)}
                className="w-full px-3 py-2 glass-input outline-none text-slate-900 text-sm appearance-none bg-white/60"
              >
                <option value="username">Username</option>
                <option value="real_name">Real Name</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <input
                type="text"
                value={newIdentity}
                onChange={(e) => setNewIdentity(e.target.value)}
                placeholder="e.g. john.smith"
                required
                className="w-full px-3 py-2 glass-input outline-none text-slate-900 text-sm placeholder:text-slate-400"
              />
            </div>
            <div className="sm:col-span-1">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (optional)"
                className="w-full px-3 py-2 glass-input outline-none text-slate-900 text-sm placeholder:text-slate-400"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={monitorMutation.isPending}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold px-5 py-2 text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {monitorMutation.isPending ? "Checking..." : "Add to Monitor List"}
          </button>
          {monitorMutation.isError && (
            <p className="text-xs text-red-600">{(monitorMutation.error as any)?.message || "Error adding identity"}</p>
          )}
        </form>
      </div>

      {/* Monitored Identities */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Your Monitored Identities
        </h2>
        {monitored && monitored.length > 0 ? (
          <div className="space-y-2">
            {monitored.map((item) => (
              <div key={item.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`text-xs font-bold px-2 py-0.5 ${
                    item.identityType === "username" ? "text-blue-700 bg-blue-50" :
                    item.identityType === "real_name" ? "text-emerald-700 bg-emerald-50" :
                    "text-purple-700 bg-purple-50"
                  }`}>
                    {item.identityType === "username" ? "USER" : item.identityType === "real_name" ? "NAME" : "EMAIL"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{item.identityValue}</div>
                    {item.label && <div className="text-xs text-slate-500">{item.label}</div>}
                  </div>
                  {item.unreadAlerts > 0 && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5">
                      {item.unreadAlerts} alert{item.unreadAlerts !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeMutation.mutate({ id: item.id })}
                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 text-center text-slate-500">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No identities monitored yet.</p>
            <p className="text-xs text-slate-400">Add one above to start tracking.</p>
          </div>
        )}
      </div>

      {/* Breach Alerts */}
      <div>
        <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Breach Alerts
        </h2>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`glass-card p-4 ${alert.isRead ? "opacity-60" : "border-red-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!alert.isRead && <div className="w-2 h-2 bg-red-500" />}
                      <span className="font-bold text-slate-900">{alert.breachName}</span>
                      {alert.breachDate && (
                        <span className="text-xs text-slate-500">({alert.breachDate})</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{alert.description}</p>
                    {alert.dataClasses && (
                      <p className="text-xs text-slate-500">
                        Data: {alert.dataClasses}
                      </p>
                    )}
                  </div>
                  {!alert.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate({ alertId: alert.id })}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 shrink-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 text-center text-slate-500">
            <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No breach alerts yet.</p>
            <p className="text-xs text-slate-400">We'll notify you if any of your monitored identities appear in new breaches.</p>
          </div>
        )}
      </div>
    </div>
  );
}
