"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Clock, Calendar, Settings, LogOut, Calendar as CalIcon, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/doctors", label: "Doctors", icon: Users },
  { to: "/admin/availability", label: "Availability", icon: Clock },
  { to: "/admin/appointments", label: "Appointments", icon: Calendar },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({ mobile, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout("/");
  };

  return (
    <aside className={`bg-slate-900 flex flex-col ${mobile ? "w-64" : "w-60"} h-full`}>
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
            <CalIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Medi<span className="text-teal-400">Slot</span>
            </span>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 w-full transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
