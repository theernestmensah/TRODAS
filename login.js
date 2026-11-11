(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const slot = $('signIn');

  // Today tile: the portal's deadline date tile, showing today.
  const now = new Date();
  $('todayDay').textContent = String(now.getDate());
  $('todayMonth').textContent = now.toLocaleDateString('en', { month: 'short' });
  $('todayLabel').textContent = now.toLocaleDateString('en', { weekday: 'long' });

  const setupMessages = {
    'file': 'Sign-in only works when the portal is served over http. Start it with start.bat, then open http://localhost:5500/login.html.',
    'missing-key': 'Add your Clerk publishable key to config.js, then reload this page.',
    'bad-key': 'The clerkPublishableKey value in config.js isn’t a Clerk publishable key. It should start with pk_test_ or pk_live_.'
  };

  function showSetup(reason) {
    slot.hidden = true;
    $('setupMessage').textContent = setupMessages[reason];
    $('setupPanel').hidden = false;
  }

  function showError(error) {
    console.error('[login] Clerk failed to load.', error);
    slot.hidden = true;
    $('errorPanel').hidden = false;
  }

  $('retrySignIn').addEventListener('click', () => window.location.reload());

  TrodasAuth.loadClerk()
    .then(clerk => {
      const target = TrodasAuth.redirectTarget();
      if (clerk.user) {
        window.location.replace(target);
        return;
      }
      slot.replaceChildren();
      clerk.mountSignIn(slot, {
        forceRedirectUrl: target,
        withSignUp: false,
        // Invite-only: hide "Don't have an account? Sign up". Clerk's Restricted sign-up mode enforces it.
        appearance: { elements: { footerAction: { display: 'none' } } }
      });
      slot.setAttribute('aria-busy', 'false');
      slot.classList.add('is-ready');
    })
    .catch(error => {
      if (error && error.reason in setupMessages) showSetup(error.reason);
      else showError(error);
    });
})();
