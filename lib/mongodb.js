import mongoose from "mongoose"
import dns from "node:dns"

// Ensure reliable SRV record lookups on Windows/ISP DNS
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"])
} catch {}

function normalizeMongoUri(rawUri) {
  if (!rawUri) return "mongodb://127.0.0.1:27017/medislot"
  let uri = rawUri.replace(/\r?\n/g, "").trim()

  // If no DB specified before ?, add /medislot
  if (uri.includes(".mongodb.net/?") || uri.endsWith(".mongodb.net/")) {
    uri = uri
      .replace(".mongodb.net/?", ".mongodb.net/medislot?")
      .replace(/\.mongodb\.net\/$/, ".mongodb.net/medislot")
  } else if (
    uri.includes(".mongodb.net") &&
    !uri.match(/\.mongodb\.net\/[a-zA-Z0-9_-]+/)
  ) {
    const qIndex = uri.indexOf("?")
    if (qIndex !== -1) {
      uri = uri.slice(0, qIndex) + "/medislot" + uri.slice(qIndex)
    } else {
      uri = uri + "/medislot"
    }
  }
  return uri
}

function getDirectReplicaUri(srvUri) {
  if (srvUri.includes("medislotcluster.q6oldui.mongodb.net")) {
    const credMatch = srvUri.match(/mongodb\+srv:\/\/([^@]+)@/)
    const creds = credMatch ? credMatch[1] : "medslot_user:78678600"
    return `mongodb://${creds}@ac-zzoecse-shard-00-00.q6oldui.mongodb.net:27017,ac-zzoecse-shard-00-01.q6oldui.mongodb.net:27017,ac-zzoecse-shard-00-02.q6oldui.mongodb.net:27017/medislot?ssl=true&replicaSet=atlas-ienvcz-shard-0&authSource=admin&retryWrites=true&w=majority`
  }
  return null
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn && cached.conn.connection?.readyState === 1) {
    return cached.conn
  }

  const rawUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medislot"
  const normalizedUri = normalizeMongoUri(rawUri)

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 8000,
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      // Strategy 1: Attempt normalized URI
      try {
        const instance = await mongoose.connect(normalizedUri, opts)
        return instance
      } catch (err) {
        // Strategy 2: If SRV failed, attempt direct replica set shards
        const directUri = getDirectReplicaUri(normalizedUri)
        if (directUri && directUri !== normalizedUri) {
          console.warn(
            "[MongoDB] SRV connect failed, falling back to direct replica set shards...",
          )
          const instance = await mongoose.connect(directUri, opts)
          return instance
        }
        throw err
      }
    })()
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectToDatabase
