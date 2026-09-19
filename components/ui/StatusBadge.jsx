const statusConfig = {
  confirmed: {
    label: "Confirmed",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  completed: {
    label: "Completed",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-600 border border-red-200",
  },
  available: {
    label: "Available",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
  },
  unavailable: {
    label: "Unavailable",
    className: "bg-slate-100 text-slate-500 border border-slate-200",
  },
  active: {
    label: "Active",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
  },
  inactive: {
    label: "Inactive",
    className: "bg-red-50 text-red-600 border border-red-200",
  },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status?.toLowerCase()] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}
