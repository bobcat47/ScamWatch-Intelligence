import { type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Home, FileWarning, Search, LayoutDashboard,
  MessageCircle, Map, Database, User, LogIn, LogOut, PhoneCall,
} from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const mainNav = [
    { path: "/", label: "Intel", icon: Home },
    { path: "/map", label: "Map", icon: Map },
    { path: "/check", label: "Lookup", icon: Search },
    { path: "/report", label: "Report", icon: FileWarning },
    { path: "/dashboard", label: "Database", icon: LayoutDashboard },
    { path: "/chat", label: "Chat", icon: MessageCircle },
    { path: "/call-shield", label: "Shield", icon: PhoneCall },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="sticky top-0 z-50 glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2.5 group">
              <Shield className="w-6 h-6 text-red-600" />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm tracking-tight text-slate-900">ScamWatch</span>
                <span className="text-[9px] text-amber-700 tracking-[0.15em] uppercase font-semibold">Intelligence</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all ${
                      isActive ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]"
                    }`}>
                    <Icon className="w-3.5 h-3.5" />{item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-2">
              <Link to="/lookup-identity"
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all ${
                  location.pathname === "/lookup-identity" ? "bg-amber-600 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]"
                }`}>
                <Database className="w-3.5 h-3.5" />Breach Check
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link to="/account"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all ${
                      location.pathname === "/account" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]"
                    }`}>
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{user?.name?.split(" ")[0] || "Account"}</span>
                  </Link>
                  <button onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Sign Out">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link to="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-slate-800 text-white hover:bg-slate-700 transition-all">
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden border-t border-black/[0.06] bg-white/60">
          <div className="max-w-7xl mx-auto px-1 flex justify-around py-1.5 overflow-x-auto">
            {[...mainNav, { path: "/lookup-identity", label: "Breach", icon: Database }].map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium whitespace-nowrap ${isActive ? "text-red-600" : "text-slate-500"}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-[9px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white border-t border-black/[0.06] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-slate-500">
            ScamWatch Intelligence — OSINT-powered scam tracking + identity breach monitoring
          </p>
        </div>
      </footer>
    </div>
  );
}
