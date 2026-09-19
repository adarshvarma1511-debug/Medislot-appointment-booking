"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import DatabaseBadge from "../ui/DatabaseBadge";
import NotificationBell from "../ui/NotificationBell";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const { isAuthenticated, isLoaded, isLoggingOut, user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || isLoggingOut) return;
    if (!isAuthenticated) {
      router.replace("/admin/login");
    } else if (user?.role !== "admin") {
      if (user?.role === "doctor") {
        router.replace("/doctor/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoaded, isLoggingOut, user, router]);

  if (isLoggingOut) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (!isLoaded || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Verifying Admin Authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">MediSlot Admin</h2>
              <p className="text-xs text-slate-400">Hospital Administration Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DatabaseBadge />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Admin</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
