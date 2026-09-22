"use client"

// Check MongoDB connectivity

// Hydrate client-side from localStorage (cache memory)

// Register account directly in MongoDB

// Login with credentials directly against MongoDB

// Save directly to MongoDB Atlas

// Sync with MongoDB API

// Sync with MongoDB API

// Also update doctors list state

// Sync with MongoDB API

// Sync session with backend /api/auth/me if cookie exists

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"

import { useRouter } from "next/navigation"

const STORAGE_USER_KEY = "medislot_user"

const STORAGE_APPTS_KEY = "medislot_appointments"

const STORAGE_AVAIL_KEY = "medislot_doctor_avail"

const STORAGE_ACCOUNTS_KEY = "medislot_accounts"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const router = useRouter()

  const [user, setUser] = useState(null)

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [appointments, setAppointments] = useState([])

  const [doctors, setDoctors] = useState([])

  const [doctorAvailabilities, setDoctorAvailabilities] = useState({})

  const [isLoaded, setIsLoaded] = useState(false)

  const [dbStatus, setDbStatus] = useState({
    checked: false,

    connected: false,

    message: "Checking database status...",
  })

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch("/api/doctors")

      const data = await res.json()

      if (data.success && Array.isArray(data.doctors)) {
        setDoctors(data.doctors)

        const availMap = {}

        data.doctors.forEach((d) => {
          availMap[d.id] =
            d.availableToday ??
            true
        })

        setDoctorAvailabilities((prev) => ({ ...prev, ...availMap }))
      }
    } catch (e) {
      console.warn("Could not fetch doctors from API:", e)
    }
  }, [])

  const fetchAppointments = useCallback(
    async (userContext) => {
      try {
        const currentUser =
          userContext ||
          user

        if (!currentUser?.email && !currentUser?._id && !currentUser?.id) {
          setAppointments([])

          return
        }

        let url = "/api/appointments"

        if (
          currentUser?.role ===
          "doctor"
        ) {
          url = `/api/doctor/appointments?email=${encodeURIComponent(currentUser.email)}&doctorId=${encodeURIComponent(currentUser.doctorId || currentUser._id || "")}`
        } else if (
          currentUser?.role ===
          "patient"
        ) {
          url = `/api/patient/appointments?email=${encodeURIComponent(currentUser.email)}&patientId=${encodeURIComponent(currentUser._id || currentUser.id || "")}`
        }

        const res = await fetch(url)

        const data = await res.json()

        if (data.success && Array.isArray(data.appointments)) {
          setAppointments(data.appointments)

          localStorage.setItem(
            STORAGE_APPTS_KEY,

            JSON.stringify(data.appointments),
          )
        } else {
          setAppointments([])
        }
      } catch (e) {
        console.warn("Could not sync appointments from API", e)

        setAppointments([])
      }
    },

    [user],
  )

  const refreshDbStatus = useCallback(async () => {
    setDbStatus((prev) => ({
      ...prev,

      message: "Testing MongoDB connection...",
    }))

    try {
      const res = await fetch("/api/db-status")

      const data = await res.json()

      if (data.connected) {
        setDbStatus({
          checked: true,

          connected: true,

          message: `MongoDB Connected (${data.database})`,

          host: data.host,

          database: data.database,
        })

        fetchDoctors()
      } else {
        setDbStatus({
          checked: true,

          connected: false,

          message:
            data.message ||
            "MongoDB is currently offline",

          error: data.error,

          hint: data.hint,
        })
      }
    } catch (err) {
      setDbStatus({
        checked: true,

        connected: false,

        message: "MongoDB offline",

        error: err.message,
      })
    }
  }, [fetchDoctors])

  useEffect(() => {
    refreshDbStatus()
  }, [refreshDbStatus])

  useEffect(() => {
    if (user) {
      fetchAppointments(user)
    } else {
      setAppointments([])
    }
  }, [user, fetchAppointments])

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_USER_KEY)

      if (storedUser) {
        const parsed = JSON.parse(storedUser)

        if (parsed && (parsed.email || parsed.id || parsed._id)) {
          setUser(parsed)
        }
      }

      const storedAvail = localStorage.getItem(STORAGE_AVAIL_KEY)

      if (storedAvail) {
        setDoctorAvailabilities(JSON.parse(storedAvail))
      }

      fetch("/api/auth/me")

        .then((res) => {
          if (res.ok) return res.json()

          return null
        })

        .then((data) => {
          if (data && data.success && data.user) {
            persistUser(data.user)
          }
        })

        .catch(() => {})
    } catch (e) {
      console.warn("Failed to load state from localStorage:", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const persistUser = (newUser) => {
    setUser(newUser)

    try {
      if (newUser) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser))

        if (typeof document !== "undefined") {
          document.cookie = `medislot_role=${
            newUser.role || ""
          }; path=/; max-age=2592000`
        }
      } else {
        localStorage.removeItem(STORAGE_USER_KEY)

        if (typeof document !== "undefined") {
          document.cookie =
            "medislot_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"

          document.cookie =
            "medislot_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
      }
    } catch (e) {
      console.warn("Failed to save user to localStorage:", e)
    }
  }

  const registerAccount = async (accountData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(accountData),
      })

      const data = await res.json()

      if (data.success && data.user) {
        persistUser(data.user)

        if (data.user.role === "doctor") {
          fetchDoctors()
        }

        return { success: true, user: data.user }
      }

      return {
        success: false,

        error: data.error || "Registration failed",
      }
    } catch (err) {
      console.error("Registration error:", err)

      return {
        success: false,

        error: err.message || "Failed to register account",
      }
    }
  }

  const loginWithCredentials = async (email, password, expectedRole) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ email, password, role: expectedRole }),
      })

      const data = await res.json()

      if (data.success && data.user) {
        persistUser(data.user)

        return { success: true, user: data.user }
      }

      const errorText = data.message || data.error || "Invalid credentials"

      return { success: false, error: errorText, message: errorText }
    } catch (err) {
      console.error("Login error:", err)

      return {
        success: false,

        error: err.message || "Failed to log in",

        message: err.message || "Failed to log in",
      }
    }
  }

  const login = (userData) => {
    if (!userData) return

    persistUser(userData)
  }

  const loginWithGoogle = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/api/auth/google"
    }
  }

  const logout = async (redirectTo = "/") => {
    setIsLoggingOut(true)

    try {
      await fetch("/api/auth/logout", {
        method: "POST",

        headers: { "Content-Type": "application/json" },
      })
    } catch (e) {
      console.warn("Failed to contact logout endpoint:", e)
    }

    persistUser(null)

    setAppointments([])

    try {
      localStorage.removeItem(STORAGE_USER_KEY)

      localStorage.removeItem(STORAGE_APPTS_KEY)

      localStorage.removeItem(STORAGE_AVAIL_KEY)

      localStorage.removeItem("medislot_remembered_patient")

      localStorage.removeItem("medislot_remembered_doctor")
    } catch (e) {
      console.warn("Failed to clear localStorage keys on logout:", e)
    }

    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear()
      }
    } catch (e) {}

    try {
      if (typeof document !== "undefined") {
        document.cookie =
          "medislot_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"

        document.cookie =
          "medislot_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }
    } catch (e) {}

    if (redirectTo) {
      router.replace(redirectTo)
    }

    setTimeout(() => {
      setIsLoggingOut(false)
    }, 250)
  }

  const updateUser = (updated) => {
    setUser((prev) => {
      if (!prev) return null

      const nextUser = { ...prev, ...updated }

      persistUser(nextUser)

      return nextUser
    })

    if (user?.email) {
      fetch("/api/auth/me", {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ email: user.email, ...updated }),
      }).catch((e) => console.warn("Could not sync user update with API:", e))
    }
  }

  const addAppointment = async (apptData) => {
    const payload = {
      ...apptData,

      patientId: user?._id || user?.id,

      patientEmail: apptData.patientEmail || user?.email,

      patientName: apptData.patientName || user?.name,

      patientPhone: apptData.patientPhone || user?.phone,
    }

    const res = await fetch("/api/appointments", {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(
        data.message || data.error || "This time slot is no longer available.",
      )
    }

    const createdAppt = data.appointment

    setAppointments((prev) => [
      createdAppt,

      ...prev.filter(
        (a) => a.id !== createdAppt.id,
      ),
    ])

    return createdAppt
  }

  const cancelAppointment = async (id) => {
    try {
      await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },
      })
    } catch (e) {
      console.warn("Could not cancel appointment on API:", e)
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id || a.appointmentId === id
          ? { ...a, status: "cancelled" }
          : a,
      ),
    )
  }

  const updateAppointmentStatus = async (
    id,

    newStatus,

    consultationDetails,
  ) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => {
        if (a.id === id || a.appointmentId === id) {
          return {
            ...a,

            status: newStatus,

            ...(consultationDetails ? { consultationDetails } : {}),
          }
        }

        return a
      })

      try {
        localStorage.setItem(STORAGE_APPTS_KEY, JSON.stringify(updated))
      } catch (e) {
        console.warn("Failed to update appointments locally:", e)
      }

      return updated
    })

    try {
      await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          status: newStatus,

          consultationDetails,
        }),
      })
    } catch (e) {
      console.warn("Could not update appointment on API:", e)
    }
  }

  const toggleDoctorAvailability = async (docId) => {
    let nextValue

    setDoctorAvailabilities((prev) => {
      nextValue = !prev[docId]

      const updated = {
        ...prev,

        [docId]: nextValue,
      }

      try {
        localStorage.setItem(STORAGE_AVAIL_KEY, JSON.stringify(updated))
      } catch (e) {
        console.warn("Failed to update doctor availability locally:", e)
      }

      return updated
    })

    setDoctors((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, availableToday: nextValue } : d,
      ),
    )

    try {
      await fetch("/api/doctors", {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          doctorId: docId,

          availableToday: nextValue,
        }),
      })
    } catch (e) {
      console.warn("Could not sync doctor availability with API:", e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,

        isLoaded,

        isLoggingOut,

        user,

        appointments,

        doctors,

        fetchDoctors,

        fetchAppointments,

        doctorAvailabilities,

        dbStatus,

        refreshDbStatus,

        login,

        loginWithGoogle,

        loginWithCredentials,

        registerAccount,

        logout,

        updateUser,

        addAppointment,

        cancelAppointment,

        updateAppointmentStatus,

        toggleDoctorAvailability,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
