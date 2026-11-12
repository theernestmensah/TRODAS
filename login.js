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
      // Invitation links (sent from the Admin page) land here with Clerk's ticket in the URL.
      // A new person gets the sign-up form; the ticket fixes their email to the invited one.
      const params = new URLSearchParams(window.location.search);
      const invitation = params.has('__clerk_ticket') && params.get('__clerk_status') === 'sign_up';
      if (clerk.user && invitation) {
        // Someone else is signed in on this browser: offer to sign out and accept, instead of
        // silently opening the portal as them.
        const who = clerk.user.primaryEmailAddress?.emailAddress || TrodasAuth.displayName(clerk.user);
        slot.hidden = true;
        $('inviteMessage').textContent = `This browser is signed in as ${who}, but the invitation is for a new account. Sign out to accept it, or carry on as ${who}.`;
        $('continuePortal').href = target;
        $('acceptInvite').addEventListener('click', () => clerk.signOut({ redirectUrl: window.location.href }));
        $('invitePanel').hidden = false;
        return;
      }
      if (clerk.user) {
        window.location.replace(target);
        return;
      }
      slot.replaceChildren();
      const hideFooter = { elements: { footerAction: { display: 'none' } } };
      if (invitation) {
        clerk.mountSignUp(slot, { forceRedirectUrl: target, appearance: hideFooter });
      } else {
        clerk.mountSignIn(slot, {
          forceRedirectUrl: target,
          withSignUp: false,
          // Invite-only: hide "Don't have an account? Sign up". Clerk's invite-only mode enforces it.
          appearance: hideFooter
        });
      }
      slot.setAttribute('aria-busy', 'false');
      slot.classList.add('is-ready');
    })
    .catch(error => {
      if (error && error.reason in setupMessages) showSetup(error.reason);
      else showError(error);
    });
})();
