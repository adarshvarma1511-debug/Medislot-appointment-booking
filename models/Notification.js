import mongoose from "mongoose"

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient ID is required"],
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: [true, "Recipient role is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    relatedId: {
      type: String,
      default: null,
      trim: true,
    },
    relatedType: {
      type: String,
      enum: ["appointment", "doctor", "patient", "system"],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 })

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema)
