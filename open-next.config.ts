import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Add an incremental cache (R2/KV) here only if you start using ISR or `revalidate`.
export default defineCloudflareConfig({});
