"use client"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Hospital,
  ShieldCheck,
  Check,
  Save,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import DoctorLayout from "@/components/layout/DoctorLayout"
import PasswordSecurityCard from "@/components/security/PasswordSecurityCard"

export default function DoctorProfilePage() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || "Dr. Amit Sharma")
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210")
  const [specialization, setSpecialization] = useState(
    user?.specialization || "Cardiologist",
  )
  const [department, setDepartment] = useState(user?.department || "Cardiology")
  const [experience, setExperience] = useState(user?.experience || 8)
  const [hospital, setHospital] = useState(
    user?.hospital || "MediSlot Hospital",
  )
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name || "Dr. Amit Sharma")
      setPhone(user.phone || "+91 98765 43210")
      setSpecialization(user.specialization || "Cardiologist")
      setDepartment(user.department || "Cardiology")
      setExperience(user.experience || 8)
      setHospital(user.hospital || "MediSlot Hospital")
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg("")
    setSavedSuccess(false)

    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          doctorId: user?.doctorId,
          name,
          phone,
          specialization,
          department,
          experience: Number(experience),
          hospital,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to update profile.")
        setSaving(false)
        return
      }

      updateUser({
        name,
        phone,
        specialization,
        department,
        experience: Number(experience),
        hospital,
      })

      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      setErrorMsg("Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  const emailDisplay = user?.email || ""

  return (
    <DoctorLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Doctor Profile & Account Details
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View your clinical credentials, contact numbers, and login profile
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-5 h-5 text-emerald-600" />
            Profile details updated successfully!
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {}
          <div className="p-6 bg-gradient-to-r from-teal-700 to-teal-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm shadow-sm">
                {user?.avatar || "AS"}
              </div>
              <div>
                <h2 className="text-xl font-bold">{name}</h2>
                <p className="text-xs text-teal-100 mt-0.5">
                  {specialization} • {department}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Role: Doctor (Verified)
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Account & Login Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">
                    Doctor Login Email
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emailDisplay}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used for doctor dashboard sign-in.
                  </p>
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">
                    Account Role
                  </label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold flex items-center justify-between">
                    <span>Doctor</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Locked
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Role is immutable and strictly managed by Hospital
                    Administration.
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical & Personal Information
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Doctor Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Specialization
                  </label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Hospital / Clinic
                  </label>
                  <input
                    type="text"
                    required
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {}
        <PasswordSecurityCard
          title="Password & Security"
          description="Manage your doctor portal password to protect confidential clinical records."
        />
      </div>
    </DoctorLayout>
  )
}
