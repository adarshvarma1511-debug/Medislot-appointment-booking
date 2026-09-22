"use client"

// Compute departments from loaded doctors

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Filter, Stethoscope, PlusCircle } from "lucide-react"
import DoctorCard from "@/components/ui/DoctorCard"
import PatientLayout from "@/components/layout/PatientLayout"

const experiences = ["Any", "0-5 years", "5-10 years", "10+ years"]

function FindDoctorsContent() {
  const searchParams = useSearchParams()
  const initialDept = searchParams.get("dept") || "All"

  const [doctorsList, setDoctorsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [dept, setDept] = useState(initialDept)
  const [avail, setAvail] = useState("All")
  const [exp, setExp] = useState("Any")

  useEffect(() => {
    const d = searchParams.get("dept")
    if (d) setDept(d)
  }, [searchParams])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/doctors")
      const data = await res.json()
      if (data.success && Array.isArray(data.doctors)) {
        setDoctorsList(data.doctors)
      } else {
        setDoctorsList([])
      }
    } catch (e) {
      console.warn("Could not load doctors from database:", e)
      setDoctorsList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])
  const departments = [
    "All",
    ...new Set(doctorsList.map((d) => d.department).filter(Boolean)),
  ]

  const filtered = doctorsList.filter((d) => {
    const matchQuery =
      query === "" ||
      d.name?.toLowerCase().includes(query.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(query.toLowerCase()) ||
      d.department?.toLowerCase().includes(query.toLowerCase())
    const matchDept = dept === "All" || d.department === dept
    const matchAvail =
      avail === "All" ||
      (avail === "Today" && d.availableToday) ||
      (avail === "Not Today" && !d.availableToday)
    const expYears = Number(d.experience) || 0
    const matchExp =
      exp === "Any" ||
      (exp === "0-5 years" && expYears <= 5) ||
      (exp === "5-10 years" && expYears > 5 && expYears <= 10) ||
      (exp === "10+ years" && expYears > 10)
    return matchQuery && matchDept && matchAvail && matchExp
  })

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Find a Doctor
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Search and discover verified hospital specialists from MongoDB
        </p>
      </div>

      {}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search doctor by name or specialization..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-teal-500"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All Departments" : d}
            </option>
          ))}
        </select>
        <select
          value={avail}
          onChange={(e) => setAvail(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-teal-500"
        >
          <option value="All">Any Availability</option>
          <option value="Today">Available Today</option>
          <option value="Not Today">Not Today</option>
        </select>
        <select
          value={exp}
          onChange={(e) => setExp(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-teal-500"
        >
          {experiences.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} doctors available
        </span>
      </div>

      {}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="font-semibold text-slate-700 text-sm">
            Loading doctors...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Retrieving verified doctors from database
          </p>
        </div>
      ) : doctorsList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            No doctors are currently available.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
            There are no active doctors in the hospital database yet.
          </p>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl inline-block text-xs text-slate-600 border border-slate-100">
            Admin can add doctors from:{" "}
            <strong className="text-teal-700">
              Admin Dashboard → Doctors → + Add Doctor
            </strong>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <DoctorCard key={d.id || d._id} doctor={d} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-100">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium text-slate-700">
            No doctors match your filter
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try clearing your search or resetting filters
          </p>
        </div>
      )}
    </div>
  )
}

export default function FindDoctorsPage() {
  return (
    <PatientLayout>
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm">Loading doctors...</div>
        }
      >
        <FindDoctorsContent />
      </Suspense>
    </PatientLayout>
  )
}
