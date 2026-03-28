import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    /**
     * Explicit allowlist — never use { hostname: '**' } in production.
     * Wildcard patterns disable the allowlist entirely and allow anyone to
     * proxy arbitrary images through your Next.js image optimizer (CDN cost
     * and potential SSRF vector).
     *
     * Adding a new source: append a new entry here and deploy.
     */
    remotePatterns: [
      // Gravatar — used for user avatars when email is provided
      { protocol: 'https', hostname: 'www.gravatar.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
      // GitHub avatars — common for developer workspaces
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Google user content — Google OAuth profile photos
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Unsplash — used by placeholder/demo profile images
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
