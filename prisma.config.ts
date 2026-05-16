import path from "node:path"
import fs from "node:fs"
import { defineConfig } from "prisma/config"

// Load .env manually for Prisma CLI (which doesn't go through Next.js)
const envPath = path.join(__dirname, ".env")
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
