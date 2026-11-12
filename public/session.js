/*
 * Portal session: keeps index.html behind Clerk sign-in, shows who is signed in,
 * and connects Convex with their session.
 */
(async function () {
  'use strict';

  const clerk = await TrodasAuth.requireUser();

  function initials(name) {
    const parts = String(name).replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }

  function showUser(user) {
    if (!user) return;
    const name = TrodasAuth.displayName(user);
    const email = user.primaryEmailAddress?.emailAddress || '';
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileDetail').textContent = email && email !== name ? email : 'Signed in';
    document.getElementById('profileAvatar').textContent = initials(name);
  }

  showUser(clerk.user);
  clerk.addListener(({ user }) => showUser(user));

  const userButton = document.getElementById('userButton');
  if (userButton) {
    clerk.mountUserButton(userButton, {
      appearance: { elements: { userButtonAvatarBox: { width: '32px', height: '32px' } } }
    });
  }

  document.documentElement.classList.remove('auth-pending');

  // app.js listens for these to load projects from Convex.
  const announce = (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail }));
  const NOT_ACCEPTED = 'Convex didn’t accept your sign-in. Check the Clerk ↔ Convex setup in README.md.';

  try {
    await TrodasAuth.connectConvex(clerk, {
      onReady(client) {
        announce('portal:convex-ready', { client });
      },
      onError(error) {
        console.warn('[session] Convex is not accepting this session yet.', error);
        announce('portal:convex-error', { message: NOT_ACCEPTED });
        if (typeof toast === 'function') toast(NOT_ACCEPTED);
      }
    });
  } catch (error) {
    console.warn('[session] Could not load the Convex client.', error);
    announce('portal:convex-error', { message: 'The Convex client couldn’t be loaded. Check your connection and reload.' });
  }
})();
