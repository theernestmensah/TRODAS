/*
 * Shared sign-in plumbing for the portal (no build step).
 *
 * Clerk: clerk-js and its UI bundle load from your Clerk Frontend API, the same way
 *        Clerk's own SDKs load them. The host is derived from clerkPublishableKey.
 * Convex: the browser client loads from jsDelivr, pinned to the version in package.json
 *        and checked with Subresource Integrity. Bump both together.
 */
(function () {
  'use strict';

  const CLERK_JS_MAJOR = '6';
  const CLERK_UI_MAJOR = '1';
  const CONVEX_BUNDLE = {
    src: 'https://cdn.jsdelivr.net/npm/convex@1.49.0/dist/browser.bundle.js',
    integrity: 'sha384-j1GvTwRQm1wiuoiDQQ4HOfW9lti175UuEMtkoqsMzgXLR81BsiNE7MwOjE5DwEEN'
  };
  const SCRIPT_TIMEOUT_MS = 15000;
  const LOGIN_PAGE = 'login.html';
  const HOME_PAGE = 'index.html';

  const pageUrl = path => new URL(path, window.location.href).href;
  const config = () => window.ELLIX_CONFIG || {};

  class AuthSetupError extends Error {
    constructor(reason, message) {
      super(message);
      this.name = 'AuthSetupError';
      this.reason = reason;
    }
  }

  // Shared look for every Clerk component, taken from the portal's tokens (styles.css :root).
  const appearance = {
    variables: {
      colorPrimary: '#0040c1',
      colorPrimaryForeground: '#ffffff',
      colorForeground: '#152139',
      colorMutedForeground: '#58657a',
      colorNeutral: '#152139',
      colorBackground: '#ffffff',
      colorInput: '#ffffff',
      colorInputForeground: '#152139',
      colorDanger: '#b42318',
      colorRing: '#5485ee',
      colorModalBackdrop: '#0c1737',
      fontFamily: 'Inter, Arial, sans-serif',
      fontFamilyButtons: 'Inter, Arial, sans-serif',
      fontSize: '0.875rem',
      borderRadius: '0.5rem'
    },
    options: {
      logoPlacement: 'none',
      socialButtonsPlacement: 'bottom'
    },
    elements: {
      rootBox: { width: '100%' },
      cardBox: {
        width: '100%',
        maxWidth: '100%',
        borderRadius: '14px',
        border: '1px solid #dde4ee',
        boxShadow: 'none'
      },
      headerTitle: {
        fontFamily: '"Inter Tight", Inter, Arial, sans-serif',
        fontSize: '1.375rem',
        fontWeight: 700,
        letterSpacing: '-0.025em'
      },
      headerSubtitle: { color: '#58657a' },
      formButtonPrimary: { fontWeight: 650, minHeight: '42px' },
      formFieldInput: { minHeight: '42px' }
    }
  };

  const localization = {
    signIn: {
      start: {
        title: 'Sign in to the project portal',
        subtitle: 'Use the email address your invitation was sent to.'
      }
    },
    // Shown when someone opens their invitation link (login.js mounts sign-up for it).
    signUp: {
      start: {
        title: 'Accept your invitation',
        subtitle: 'Set up your sign-in for the Trodas project portal.'
      }
    }
  };

  // pk_test_<base64("your-app.clerk.accounts.dev$")> → "your-app.clerk.accounts.dev"
  function frontendApiFromKey(key) {
    const match = /^pk_(test|live)_([A-Za-z0-9+/=_-]+)$/.exec(String(key || '').trim());
    if (!match) return null;
    try {
      const decoded = atob(match[2].replace(/-/g, '+').replace(/_/g, '/'));
      if (!decoded.endsWith('$')) return null;
      const host = decoded.slice(0, -1);
      return /^[a-z0-9.-]+$/i.test(host) ? host : null;
    } catch {
      return null;
    }
  }

  // The "aud" claim of a JWT, read without verifying it (Convex does the verifying).
  function tokenAudience(jwt) {
    try {
      const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const aud = JSON.parse(atob(part.padEnd(part.length + (4 - part.length % 4) % 4, '='))).aud;
      return Array.isArray(aud) ? aud[0] : aud;
    } catch {
      return null;
    }
  }

  function loadScript(src, attributes = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        reject(new AuthSetupError('network', `Timed out loading ${src}`));
      }, SCRIPT_TIMEOUT_MS);
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => {
        clearTimeout(timer);
        reject(new AuthSetupError('network', `Could not load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  let clerkReady;

  /** Loads and initialises Clerk once per page. Resolves with window.Clerk. */
  function loadClerk() {
    if (clerkReady) return clerkReady;
    clerkReady = (async () => {
      if (window.location.protocol === 'file:') {
        throw new AuthSetupError('file', 'Sign-in needs the portal to be served over http(s).');
      }
      const key = String(config().clerkPublishableKey || '').trim();
      if (!key) throw new AuthSetupError('missing-key', 'clerkPublishableKey is empty in config.js.');
      const host = frontendApiFromKey(key);
      if (!host) throw new AuthSetupError('bad-key', 'clerkPublishableKey is not a Clerk publishable key.');

      await Promise.all([
        loadScript(`https://${host}/npm/@clerk/clerk-js@${CLERK_JS_MAJOR}/dist/clerk.browser.js`, {
          'data-clerk-publishable-key': key
        }),
        loadScript(`https://${host}/npm/@clerk/ui@${CLERK_UI_MAJOR}/dist/ui.browser.js`)
      ]);
      if (!window.Clerk || !window.__internal_ClerkUICtor) {
        throw new AuthSetupError('network', 'Clerk scripts loaded without exposing Clerk.');
      }

      await window.Clerk.load({
        ui: { ClerkUI: window.__internal_ClerkUICtor },
        appearance,
        localization,
        signInUrl: pageUrl(LOGIN_PAGE),
        afterSignOutUrl: pageUrl(LOGIN_PAGE)
      });
      return window.Clerk;
    })();
    return clerkReady;
  }

  /** Where to send someone after sign-in: ?redirect_url when it is same-origin, else the portal. */
  function redirectTarget() {
    const raw = new URLSearchParams(window.location.search).get('redirect_url');
    if (raw) {
      try {
        const url = new URL(raw, window.location.href);
        const isLogin = /\/login\.html$/i.test(url.pathname);
        if (url.origin === window.location.origin && !isLogin) return url.href;
      } catch { /* fall through to the portal */ }
    }
    return pageUrl(HOME_PAGE);
  }

  function goToLogin() {
    const url = new URL(LOGIN_PAGE, window.location.href);
    url.searchParams.set('redirect_url', window.location.href);
    window.location.replace(url.href);
  }

  /**
   * Portal pages call this first. Resolves with Clerk when someone is signed in;
   * otherwise sends them to the login page and never resolves.
   */
  async function requireUser() {
    let clerk;
    try {
      clerk = await loadClerk();
    } catch (error) {
      goToLogin();
      return new Promise(() => {});
    }
    if (!clerk.user) {
      goToLogin();
      return new Promise(() => {});
    }
    clerk.addListener(({ user }) => {
      if (!user) goToLogin();
    });
    return clerk;
  }

  /**
   * Connects Convex with the Clerk session and records the user via users:store.
   * Returns the ConvexClient, or null when convexUrl is not configured yet.
   */
  async function connectConvex(clerk, { onReady, onError } = {}) {
    const url = String(config().convexUrl || '').trim();
    if (!url) {
      console.info('[auth] convexUrl is empty in config.js, so Convex is not connected yet.');
      return null;
    }
    await loadScript(CONVEX_BUNDLE.src, { integrity: CONVEX_BUNDLE.integrity });
    const client = new window.convex.ConvexClient(url);

    client.setAuth(
      async ({ forceRefreshToken }) => {
        const session = clerk.session;
        if (!session) return null;
        try {
          // Clerk's Convex integration issues session tokens with aud "convex". Read the
          // audience from the token itself rather than lastActiveToken, which can still be
          // empty right after the page loads. Older setups use a JWT template named "convex".
          const token = await session.getToken({ skipCache: forceRefreshToken });
          if (token && tokenAudience(token) === 'convex') return token;
          return (await session.getToken({ template: 'convex', skipCache: forceRefreshToken })) || null;
        } catch (error) {
          console.warn('[auth] Could not get a Convex token from Clerk.', error);
          return null;
        }
      },
      async isAuthenticated => {
        if (!isAuthenticated) {
          onError?.(new Error('Convex did not accept the Clerk session token.'));
          return;
        }
        try {
          await client.mutation('users:store', {});
          onReady?.(client);
        } catch (error) {
          onError?.(error);
        }
      }
    );
    return client;
  }

  function displayName(user) {
    if (!user) return '';
    return user.fullName
      || [user.firstName, user.lastName].filter(Boolean).join(' ')
      || user.username
      || user.primaryEmailAddress?.emailAddress
      || 'Portal user';
  }

  window.TrodasAuth = {
    AuthSetupError,
    loadClerk,
    requireUser,
    connectConvex,
    redirectTarget,
    displayName,
    frontendApiFromKey
  };
})();
