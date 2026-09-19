"use client"

import { useState } from "react"
import { User, Mail, Phone, Save, CheckCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import PatientLayout from "@/components/layout/PatientLayout"
import PasswordSecurityCard from "@/components/security/PasswordSecurityCard"

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || "Adarsh Singh")
  const [email, setEmail] = useState(user?.email || "adarsh@example.com")
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210")
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    updateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const initials = (user?.name || name)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <PatientLayout>
      <div className="max-w-xl space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            My Profile & Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your personal details, contact numbers, and security
            credentials
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">
              {user?.name || name}
            </p>
            <p className="text-sm text-slate-500">{user?.email || email}</p>
            <p className="text-xs text-teal-600 mt-1 font-semibold capitalize">
              {user?.role || "Patient"} Account
            </p>
          </div>
        </div>

        {}
        <PasswordSecurityCard
          title="Password & Security"
          description="Manage your password to protect your patient records and booked appointments."
        />

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-5 text-sm">
            Edit Information
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            {saved && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                Profile updated successfully!
              </div>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </form>
        </div>
      </div>
    </PatientLayout>
  )
}
