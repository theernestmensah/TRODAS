// Portal settings for each environment. Everything here is public by design: the browser
// loads it. Secret keys never go in this file (they live in Convex environment variables).
//
// Which settings the portal uses:
//   - On this computer (localhost / 127.0.0.1): development.
//   - On a hosted site (Vercel, your domain…): production once it has a Clerk key,
//     otherwise development. So while production isn't set up, hosted sites use the
//     development Clerk app and Convex deployment, the same as localhost.
window.ELLIX_ENVIRONMENTS = {
  development: {
    // Clerk → Configure → API keys → Publishable key (pk_test_…).
    clerkPublishableKey: 'pk_test_ZmluZXItcGVhY29jay04NDY2LmNsZXJrLmFjY291bnRzLmRldiQ',
    // Convex deployment URL: CONVEX_URL in .env.local, printed by `npx convex dev`.
    convexUrl: 'https://clear-bandicoot-574.convex.cloud'
  },
  production: {
    // The production Clerk instance's publishable key (pk_live_…). Leave it empty to keep
    // hosted sites on the development settings.
    clerkPublishableKey: '',
    convexUrl: 'https://zealous-herring-182.convex.cloud'
  }
};

window.ELLIX_ENVIRONMENT = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname) || !window.ELLIX_ENVIRONMENTS.production.clerkPublishableKey
  ? 'development'
  : 'production';
// Leave convexUrl empty to run the portal as a demo with projects saved in this browser.
window.ELLIX_CONFIG = window.ELLIX_ENVIRONMENTS[window.ELLIX_ENVIRONMENT];
