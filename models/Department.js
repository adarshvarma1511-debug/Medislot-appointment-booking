import mongoose from "mongoose"

const DepartmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "stethoscope",
    },
    doctorCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Department ||
  mongoose.model("Department", DepartmentSchema)
