/**
 * Simple in-memory sliding window rate limiter.
 *
 * Suitable for a single Next.js process (dev / small self-hosted deployment).
 * For production at scale, replace with @upstash/ratelimit + Redis:
 *
 *   import { Ratelimit } from '@upstash/ratelimit'
 *   import { Redis } from '@upstash/redis'
 *
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, '60 s'),
 *   })
 *   const { success } = await ratelimit.limit(identifier)
 */

interface WindowEntry {
  timestamps: number[]
}

const store = new Map<string, WindowEntry>()

/**
 * Check whether `identifier` is within the allowed rate.
 *
 * @param identifier  Key to rate-limit on (e.g. IP address or user ID)
 * @param maxRequests Maximum requests allowed within `windowMs`
 * @param windowMs    Sliding window duration in milliseconds
 * @returns `{ allowed: boolean; remaining: number; resetInMs: number }`
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  const entry = store.get(identifier) ?? { timestamps: [] }

  // Evict timestamps outside the current window
  const windowStart = now - windowMs
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  const remaining = Math.max(0, maxRequests - entry.timestamps.length)
  const oldestInWindow = entry.timestamps[0] ?? now
  const resetInMs = Math.max(0, oldestInWindow + windowMs - now)

  if (entry.timestamps.length >= maxRequests) {
    store.set(identifier, entry)
    return { allowed: false, remaining: 0, resetInMs }
  }

  entry.timestamps.push(now)
  store.set(identifier, entry)
  return { allowed: true, remaining: remaining - 1, resetInMs }
}

/**
 * Extract the best available client identifier from a request.
 * Prefers real IP headers forwarded by common reverse proxies.
 */
export function getClientIdentifier(req: Request): string {
  const headers = new Headers((req as Request).headers)
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}
