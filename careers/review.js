(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const form = $('review-download-form');
  const button = $('review-download-button');
  const errorBox = $('review-error');
  const successBox = $('review-success');
  // Same isolated responsive navbar behaviour as careers/apply.html.
  const mobileButton = $('mobileMenuBtn');
  const links = document.querySelector('.nav-links');
  mobileButton?.setAttribute('aria-expanded', 'false');
  mobileButton?.setAttribute('aria-controls', 'reviewNavLinks');
  mobileButton?.addEventListener('click', () => {
    const open = !links?.classList.contains('active');
    mobileButton.classList.toggle('active', open);
    links?.classList.toggle('active', open);
    mobileButton.setAttribute('aria-expanded', String(open));
    if (!open) document.querySelectorAll('.nav-dropdown-wrap.open').forEach(el => el.classList.remove('open'));
  });
  document.querySelectorAll('.nav-dropdown-wrap > .nav-link').forEach(link => {
    link.addEventListener('click', event => {
      if (window.innerWidth > 768) return;
      event.preventDefault();
      const parent = link.closest('.nav-dropdown-wrap');
      if (!parent) return;
      const open = !parent.classList.contains('open');
      document.querySelectorAll('.nav-dropdown-wrap.open').forEach(el => el.classList.remove('open'));
      parent?.classList.toggle('open', open);
    });
  });
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('active');
    mobileButton?.classList.remove('active');
    mobileButton?.setAttribute('aria-expanded', 'false');
  }));


  // Only the signed credentials delivered in the email may authorize a download.
  // URL fragments are never transmitted to the website server in an HTTP request.
  const params = new URLSearchParams(window.location.hash.slice(1));
  // New links carry the reference in the URL path; keep older /reference emails working.
  const pathId = window.location.pathname.match(/^\/careers\/review\/([0-9a-f-]{36})\/?$/i)?.[1] || '';
  const legacyId = params.get('application') || '';
  // Never accept contradictory IDs from path and fragment.
  const id = pathId || legacyId;
  const referenceMatches = !pathId || !legacyId || pathId.toLowerCase() === legacyId.toLowerCase();
  const expires = params.get('expires') || '';
  const signature = params.get('signature') || '';
  // Remove sensitive URL fragment from history/address bar after reading it.
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  const valid = referenceMatches && uuid.test(id) && /^\d{10}$/.test(expires) && /^[a-f0-9]{64}$/.test(signature)
    && Number(expires) > Math.floor(Date.now() / 1000)
    && Number(expires) <= Math.floor(Date.now() / 1000) + 7 * 86400;
  if (uuid.test(id)) $('application-id').value = id;
  button.disabled = !valid;
  if (!valid) {
    // The bare review URL is intentionally an information-only page.
    // Never allow a CV download based on a manually entered application ID.
    const accessRequired = $('review-access-required');
    const accessDescription = $('review-access-description');
    const hasCredential = Boolean(pathId || legacyId || expires || signature);
    $('review-title').textContent = 'Secure CV access required';
    document.querySelector('.review-heading .intro').textContent = hasCredential
      ? 'This private CV link is invalid or has expired.'
      : 'Your CV is accessible through the private link sent by CFO CRAFT.';
    if (hasCredential) {
      accessDescription.textContent = 'Please open the original link from your Careers email, or contact CFO CRAFT for a new link. An Application ID alone cannot unlock a CV.';
    }
    form.hidden = true;
    accessRequired.hidden = false;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!valid) return;
    const url = new URL(`https://api.cfocraft.com/api/careers/cv/file/${encodeURIComponent(id)}`);
    url.searchParams.set('expires', expires);
    url.searchParams.set('signature', signature);
    // Normal browser navigation supports Content-Disposition: attachment cross-origin,
    // unlike fetch(), which would need CORS and could expose CV content to page JS.
    successBox.hidden = false;
    window.location.assign(url.toString());
  });
})();
