import mongoose from "mongoose"

const ConsultationDetailsSchema = new mongoose.Schema(
  {
    diagnosis: { type: String, default: "" },
    prescription: { type: String, default: "" },
    instructions: { type: String, default: "" },
    followUpDate: { type: String, default: "" },
    addedAt: { type: String, default: "" },
  },
  { _id: false },
)
const AppointmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    appointmentId: {
      type: String,
      trim: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    doctorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    patientPhone: {
      type: String,
      default: "+91 98765 43210",
      trim: true,
    },
    doctorId: {
      type: String,
      required: true,
      trim: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      default: "General",
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "upcoming",
        "completed", "cancelled"],
      default: "confirmed",
    },
    reason: {
      type: String,
      default: "Consultation & Health Examination",
    },
    consultationDetails: {
      type: ConsultationDetailsSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)
AppointmentSchema.index({ doctorId: 1, date: 1, time: 1, status: 1 })
AppointmentSchema.pre("validate", function () {
  if (this.id && !this.appointmentId) {
    this.appointmentId = this.id
  } else if (this.appointmentId && !this.id) {
    this.id = this.appointmentId
  }
})
if (mongoose.models && mongoose.models.Appointment) {
  delete mongoose.models.Appointment
}
export default mongoose.model("Appointment", AppointmentSchema)
