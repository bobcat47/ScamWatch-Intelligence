import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import ReportPage from "@/pages/ReportPage";
import CheckPage from "@/pages/CheckPage";
import DashboardPage from "@/pages/DashboardPage";
import ChatPage from "@/pages/ChatPage";
import MapPage from "@/pages/MapPage";
import LookupIdentityPage from "@/pages/LookupIdentityPage";
import AccountPage from "@/pages/AccountPage";
import CallShieldPage from "@/pages/CallShieldPage";
import LoginPage from "@/pages/Login";
import NotFoundPage from "@/pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/check" element={<CheckPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/lookup-identity" element={<LookupIdentityPage />} />
        <Route path="/call-shield" element={<CallShieldPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
