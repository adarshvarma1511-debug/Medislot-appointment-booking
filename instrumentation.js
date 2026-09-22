export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { connectToDatabase } = await import("./lib/mongodb.js")
      await connectToDatabase()
    } catch (error) {
      console.error(
        "\x1b[31m[MongoDB] Startup connection failed:\x1b[0m",
        error.message,
      )
    }
  }
}
