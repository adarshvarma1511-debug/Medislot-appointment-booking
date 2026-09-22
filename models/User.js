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



/**
 
 * @param {Object} filter - Additional match criteria
 * @returns {Promise<number>} - Count of matching admins
 */
UserSchema.statics.countAdmins = async function (filter = {}) {
  const pipeline = [
    { $match: { role: "admin", ...filter } },
    { $count: "totalAdmins" },
  ]
  const result = await this.aggregate(pipeline)
  return result.length > 0 ? result[0].totalAdmins : 0
}

/**
 * Aggregation function using $match and $count to get admin count.
 *
 * @param {Object} criteria - Match criteria for admins
 * @returns {Promise<number>} - Count of admins
 */
UserSchema.statics.matchAndCountAdmins = async function (criteria = {}) {
  const pipeline = [
    { $match: { role: "admin", ...criteria } },
    { $count: "count" },
  ]
  const result = await this.aggregate(pipeline)
  return result.length > 0 ? result[0].count : 0
}

/**
 * Aggregation function using $match and $count alias.
 */
UserSchema.statics.getAdminCount = async function (filter = {}) {
  return await this.countAdmins(filter)
}

/**
 * Aggregation pipeline using $match, $group, and $project
 * to summarize admin distribution by status and activity.
 *
 * @returns {Promise<Array>} - Aggregated statistics by status
 */
UserSchema.statics.getAdminStats = async function () {
  return await this.aggregate([
    { $match: { role: "admin" } },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
        lastLogin: { $max: "$lastLogin" },
      },
    },
    {
      $project: {
        status: "$_id",
        total: 1,
        lastLogin: 1,
        _id: 0,
      },
    },
  ])
}

/**
 * Flexible admin aggregation runner that enforces a $match for role: "admin",
 * then appends custom pipeline stages (e.g. $match, $count, $group, $sort).
 *
 * @param {Array} additionalStages - Subsequent pipeline stages
 * @returns {Promise<Array>} - Aggregation result
 */
UserSchema.statics.getAdminsAggregation = async function (additionalStages = []) {
  return await this.aggregate([
    { $match: { role: "admin" } },
    ...(Array.isArray(additionalStages) ? additionalStages : []),
  ])
}

if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User
}

const User = mongoose.model("User", UserSchema)

export async function countAdmins(filter = {}) {
  return await User.countAdmins(filter)
}

export async function matchAndCountAdmins(criteria = {}) {
  return await User.matchAndCountAdmins(criteria)
}

export async function getAdminStats() {
  return await User.getAdminStats()
}

export async function getAdminsAggregation(stages = []) {
  return await User.getAdminsAggregation(stages)
}

export default User
