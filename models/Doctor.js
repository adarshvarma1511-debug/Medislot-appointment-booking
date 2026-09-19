import mongoose from "mongoose"

const DoctorSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: Number,
      default: 5,
    },
    hospital: {
      type: String,
      default: "MediSlot City Hospital",
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewCount: {
      type: Number,
      default: 100,
    },
    consultationDuration: {
      type: Number,
      default: 30,
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Thursday", "Friday"],
    },
    availableToday: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: "DR",
    },
    weeklySchedule: {
      type: Map,
      of: String,
      default: {},
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    startTime: {
      type: String,
      default: "10:00 AM",
      trim: true,
    },
    endTime: {
      type: String,
      default: "01:00 PM",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema)
