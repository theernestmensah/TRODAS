// Convex provides process.env at deploy time; this declares it without needing @types/node.
declare const process: { env: Record<string, string | undefined> };

// Convex accepts Clerk-issued tokens for this deployment.
// Set CLERK_ISSUER_URL on the deployment (Convex dashboard → Settings →
// Environment Variables, or `npx convex env set`) to your Clerk Frontend API URL,
// e.g. https://your-app-12.clerk.accounts.dev
export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};
