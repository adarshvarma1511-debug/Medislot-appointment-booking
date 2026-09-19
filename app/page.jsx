"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  ArrowRight,
  Heart,
  Sun,
  Activity,
  Baby,
  Zap,
  Stethoscope,
  CheckCircle,
  Users,
  Clock,
  Shield,
  Search,
} from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import { useAuth } from "@/context/AuthContext"

const stats = [
  { value: "25+", label: "Expert Doctors" },
  { value: "8", label: "Departments" },
  { value: "500+", label: "Patients Served" },
  { value: "Easy", label: "Appointment Booking" },
]

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Find a Doctor",
    desc: "Search by name or specialization to discover the right doctor for your needs.",
  },
  {
    step: "02",
    icon: Calendar,
    title: "Check Availability",
    desc: "View real-time doctor availability and open time slots for your preferred date.",
  },
  {
    step: "03",
    icon: Clock,
    title: "Choose a Time Slot",
    desc: "Select a convenient appointment slot from the available options.",
  },
  {
    step: "04",
    icon: CheckCircle,
    title: "Confirm Appointment",
    desc: "Review details and confirm your appointment. Receive instant confirmation.",
  },
]

const depts = [
  { name: "Cardiology", icon: Heart, count: 4 },
  { name: "Dermatology", icon: Sun, count: 3 },
  { name: "Orthopedics", icon: Activity, count: 5 },
  { name: "Pediatrics", icon: Baby, count: 3 },
  { name: "Neurology", icon: Zap, count: 3 },
  { name: "General Medicine", icon: Stethoscope, count: 7 },
]

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  const handleFindDoctor = () => {
    if (!isAuthenticated || user?.role === "doctor") {
      router.push("/login")
    } else {
      router.push("/find-doctors")
    }
  }

  const handleBookAppointment = (customUrl) => {
    const targetUrl = typeof customUrl === "string" ? customUrl : "/book-appointment"
    if (!isAuthenticated || user?.role === "doctor") {
      router.push("/login")
    } else {
      router.push(targetUrl)
    }
  }

  const handleDepartmentClick = (deptName) => {
    if (!isAuthenticated || user?.role === "doctor") {
      router.push("/login")
    } else {
      router.push(`/find-doctors?dept=${encodeURIComponent(deptName)}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {}
      <section className="bg-gradient-to-br from-slate-50 to-teal-50/40 pt-16 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-teal-100">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              Smart Appointment Management
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Book Your Doctor
              <br />
              Appointment
              <br />
              <span className="text-teal-600">With Ease</span>
            </h1>
            <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-lg">
              Find available doctors, choose a convenient time slot, and manage
              your appointments from one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleFindDoctor}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                Find a Doctor <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleBookAppointment}
                className="bg-white hover:bg-slate-50 text-slate-800 font-medium px-6 py-3 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Book Appointment
              </button>
            </div>
          </div>

          {}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                  AS
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    Dr. Amit Sharma
                  </p>
                  <p className="text-sm text-teal-600">Cardiologist</p>
                </div>
                <div className="ml-auto w-2.5 h-2.5 bg-teal-500 rounded-full" />
              </div>
              <p className="text-xs text-slate-500 font-medium mb-3">
                Available Time Slots – Today
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "10:00 AM",
                  "10:30 AM",
                  "11:00 AM",
                  "11:30 AM",
                  "12:00 PM",
                  "12:30 PM",
                ].map((t, i) => (
                  <div
                    key={t}
                    className={`text-xs py-2 px-1 rounded-lg text-center font-medium ${
                      i === 1 || i === 4
                        ? "bg-slate-100 text-slate-400 line-through"
                        : i === 2
                          ? "bg-teal-600 text-white"
                          : "bg-teal-50 text-teal-700 border border-teal-100"
                    }`}
                  >
                    {t}
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  handleBookAppointment(
                    "/book-appointment?doctorName=Dr.+Amit+Sharma&specialization=Cardiologist&department=Cardiology&time=11:00+AM",
                  )
                }
                className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Continue Booking
              </button>
            </div>

            <div className="absolute -top-4 -right-4 bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 hidden lg:flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-medium text-slate-700">
                Appointment Confirmed!
              </span>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 hidden lg:flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-slate-700">
                500+ Happy Patients
              </span>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="bg-teal-600 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {s.value}
              </p>
              <p className="text-teal-100 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              How It Works
            </h2>
            <p className="text-slate-500 mt-3">
              Book an appointment in four simple steps
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100">
                  <s.icon className="w-6 h-6 text-teal-600" />
                </div>
                <span className="text-xs font-bold text-teal-500 tracking-widest">
                  {s.step}
                </span>
                <h3 className="font-semibold text-slate-900 mt-1 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Our Departments
            </h2>
            <p className="text-slate-500 mt-3">
              Specialized care across key medical disciplines
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {depts.map((d) => (
              <button
                key={d.name}
                onClick={() => handleDepartmentClick(d.name)}
                className="bg-white rounded-xl p-5 text-center shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-100 transition-colors">
                  <d.icon className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {d.count} Doctors
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="w-10 h-10 text-teal-400 mx-auto mb-4" />
          <h2
            className="text-3xl font-bold text-white mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Ready to Book Your Appointment?
          </h2>
          <p className="text-slate-400 mb-8">
            Join hundreds of patients who manage their healthcare with MediSlot.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.push("/register")}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg transition-colors cursor-pointer"
            >
              Create Account
            </button>
            <button
              onClick={() => router.push("/login")}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {}
      <footer
        id="about"
        className="bg-slate-900 border-t border-slate-800 py-8 px-4"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-white">MediSlot</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 MediSlot. Smart Hospital Appointment Management System.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link
              href="/admin/login"
              className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              Admin Portal
            </Link>
            <a href="#" className="hover:text-slate-300">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-300">
              Terms
            </a>
            <a href="#" className="hover:text-slate-300">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

