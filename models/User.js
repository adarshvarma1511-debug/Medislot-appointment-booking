import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google" && this.provider !== "google"
      },
    },
    phone: {
      type: String,
      default: "+91 98765 43210",
      trim: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    specialization: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    doctorId: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "AS",
    },
    provider: {
      type: String,
      default: "email",
    },
    authProvider: {
      type: String,
      default: "email",
    },
    providerId: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: "",
    },
    experience: {
      type: Number,
      default: 5,
    },
    consultationDuration: {
      type: Number,
      default: 30,
    },
    hospital: {
      type: String,
      default: "MediSlot Hospital",
      trim: true,
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Thursday", "Friday"],
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
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    passwordUpdatedAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.User || mongoose.model("User", UserSchema)
