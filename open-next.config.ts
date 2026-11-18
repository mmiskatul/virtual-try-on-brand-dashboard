import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// `npm run build` runs the OpenNext Cloudflare build, so OpenNext must call the plain
// Next.js build here (otherwise it would call `npm run build` again and loop).
// This lets Cloudflare's default commands (`npm run build` + `npx wrangler deploy`) work.
// Add an incremental cache (R2/KV) in defineCloudflareConfig only if you use ISR or `revalidate`.
export default {
  ...defineCloudflareConfig({}),
  buildCommand: 'npx next build',
};
