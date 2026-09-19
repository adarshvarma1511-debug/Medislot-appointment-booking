import { MongoMemoryServer } from "mongodb-memory-server"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.resolve(__dirname, "../../.mongo-data")

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true })
}

console.log("Starting local MongoDB instance on port 27017...")
console.log("Data directory:", dbPath)

try {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: "medislot",
      dbPath: dbPath,
      storageEngine: "wiredTiger",
    },
  })

  const uri = mongod.getUri()
  console.log("=========================================")
  console.log("MongoDB is running successfully!")
  console.log("URI:", uri)
  console.log("Port: 27017")
  console.log("Database: medislot")
  console.log("Persistent storage:", dbPath)
  console.log("=========================================")

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("Stopping MongoDB server...")
    await mongod.stop()
    process.exit(0)
  })
  process.on("SIGTERM", async () => {
    console.log("Stopping MongoDB server...")
    await mongod.stop()
    process.exit(0)
  })
} catch (error) {
  console.error("Failed to start MongoDB server:", error)
  process.exit(1)
}
