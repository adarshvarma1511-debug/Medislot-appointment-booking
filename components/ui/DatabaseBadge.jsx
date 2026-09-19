"use client"

import { useState } from "react"
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  HardDrive,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function DatabaseBadge() {
  const { dbStatus, refreshDbStatus } = useAuth()
  const [open, setOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshDbStatus()
    } finally {
      setTimeout(() => setRefreshing(false), 400)
    }
  }

  const isConnected = dbStatus?.connected

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
          isConnected
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
        }`}
        title="Click to view MongoDB database details"
      >
        <span className="relative flex h-2 w-2">
          {isConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          )}
        </span>
        <Database className="w-3 h-3 opacity-70" />
        <span className="hidden sm:inline">
          {isConnected ? "MongoDB: Live" : "DB: Offline Mode"}
        </span>
        <span className="sm:hidden">{isConnected ? "Live" : "Offline"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Database Connection
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    MediSlot Mongoose Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500">Connection Status:</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    isConnected ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Connected to MongoDB
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Offline / Demo Storage
                    </>
                  )}
                </span>
              </div>

              {isConnected ? (
                <div className="space-y-1.5 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Database Name:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {dbStatus.database || "medislot"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host:</span>
                    <span className="font-mono text-slate-800">
                      {dbStatus.host || "127.0.0.1"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Collections:</span>
                    <span className="font-medium text-slate-800">
                      users, doctors, appointments, departments
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/60 text-amber-900 leading-relaxed">
                  <p className="font-semibold text-amber-900">
                    Operating in In-Browser Fallback Mode
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Appointments, accounts, and profiles work seamlessly in
                    local storage. All Mongoose models and API handlers are
                    active.
                  </p>
                  <div className="p-2 bg-white rounded border border-amber-200/60 font-mono text-[10px] text-slate-700">
                    <p className="text-slate-400 mb-1">
                      // To connect MongoDB Atlas or Local:
                    </p>
                    <p className="font-semibold">
                      MONGODB_URI=mongodb://127.0.0.1:27017/medislot
                    </p>
                    <p className="text-slate-500 mt-1">
                      in <span className="underline">.env.local</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Testing..." : "Test Connection"}
              </button>
              <span className="text-[11px] text-slate-400">
                Port 8443 • API Active
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
