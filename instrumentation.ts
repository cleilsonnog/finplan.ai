// Runs once when a Next.js server instance starts, before any request.
// Vercel runs in UTC: without this, `getDate()` / `new Date(y, m, d)` on the server use UTC and a
// purchase at 22h in Brasília lands on the next day (and possibly the next card bill).
// Node picks up a runtime change to process.env.TZ for every Date operation after it.
// Brazil has had no DST since 2019, so this is a fixed UTC-3.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "America/Sao_Paulo";
  }
}
