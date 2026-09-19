import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"

export const metadata = {
  title: "MediSlot - Smart Hospital Appointment & OPD Booking",
  description:
    "Seamless hospital appointment booking, live doctor OPD queues, and digital consultation management.",
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
