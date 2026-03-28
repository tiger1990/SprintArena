This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

What's Still Genuinely Pending (Deferred by Design)
These were flagged as "fix before first real user" but left to your decision:

P0 — Blocks production launch:

Real authentication — Currently localStorage-only. No server-side session, no JWT, no OAuth. NextAuth.js + credentials is the fastest path; Clerk (hosted) has zero maintenance. Until this ships, any user can impersonate any workspace by editing localStorage.

Database / persistence layer — All data is in browser localStorage. Refreshing in a different browser, clearing storage, or deploying multi-user = data loss. Postgres + Prisma is the standard path.

P1 — Improve before scale:

Rate limiter in-memory limitation — Current implementation works for a single Next.js process. On Vercel or any multi-instance deployment, each instance has its own map → rate limit is bypassed by hitting different instances. The fix is Upstash/Redis (already documented in rateLimit.ts).

Pixel 5 (mobile) Playwright project — Tests currently only run on Chromium. The playwright.config.ts may have a Pixel 5 project defined; it hasn't been run in this session.

