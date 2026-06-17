import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import "../css/Layout.css";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth <= 768);
  const { user, isAdmin, isStaff } = useAuth();

  return (
  <>
    <Header userName="Admin Staff" onToggleSidebar={() => setCollapsed(!collapsed)} />
    <div className="layout">
      <Sidebar collapsed={collapsed} onClose={() => setCollapsed(true)} />
      <main className={`main-content ${collapsed ? "collapsed" : ""} ${user?.role}`}>
        <Outlet />
        <Footer />
      </main>
    </div>
  </>
);
}