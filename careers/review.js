(() => {
  'use strict';
  const BASE = 'https://api.cfocraft.com/api/careers/cv';
  const $ = (id) => document.getElementById(id);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const requestForm = $('request-form');
  const downloadForm = $('download-form');
  const errorBox = $('review-error');
  const requestButton = $('request-button');
  const downloadButton = $('download-button');
  const resendButton = $('resend-code');
  let state = 'request';
  let activeApplicationId = '';

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

  const provided = new URLSearchParams(window.location.search).get('application');
  if (provided && uuid.test(provided)) $('application-id').value = provided;

  const clearError = () => { errorBox.hidden = true; errorBox.textContent = ''; };
  const showError = text => { errorBox.textContent = text; errorBox.hidden = false; };
  const render = () => {
    requestForm.hidden = state !== 'request';
    downloadForm.hidden = state !== 'verify';
    $('review-workflow').hidden = state === 'success';
    $('review-success').hidden = state !== 'success';
    $('step-one').classList.toggle('active', state === 'request');
    $('step-two').classList.toggle('active', state === 'verify' || state === 'success');
    document.querySelector('.review-progress').hidden = state === 'success';
    $('review-fineprint').hidden = state === 'success';
  };
  clearError();
  render();

  async function sendCode() {
    clearError();
    const id = $('application-id').value.trim();
    if (!uuid.test(id)) { showError('Enter a valid Application ID.'); return; }
    requestButton.disabled = true;
    resendButton.disabled = true;
    try {
      const resp = await fetch(`${BASE}/request-code`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({application_id:id}), credentials:'omit'
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.message || 'Could not send verification code.');
      activeApplicationId = id;
      $('verification-code').value = '';
      state = 'verify';
      render();
      $('verification-code').focus();
    } catch (err) { showError(err.message || 'Unable to send code. Please try again.'); }
    finally { requestButton.disabled = false; resendButton.disabled = false; }
  }
  requestForm.addEventListener('submit', event => { event.preventDefault(); if (state === 'request') void sendCode(); });
  resendButton.addEventListener('click', async () => {
    if (state !== 'verify') return;
    // Keep code input visible on resend, do not show both forms.
    $('application-id').value = activeApplicationId;
    await sendCode();
  });
  downloadForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (state !== 'verify') return;
    clearError();
    const code = $('verification-code').value.trim();
    if (!/^\d{8}$/.test(code)) { showError('Enter the valid 8-digit verification code.'); return; }
    downloadButton.disabled = true;
    try {
      const resp = await fetch(`${BASE}/download`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({application_id:activeApplicationId,code}), credentials:'omit'
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.message || 'Code invalid or expired.'); }
      if (!String(resp.headers.get('Content-Type') || '').toLowerCase().includes('application/pdf')) throw new Error('Unexpected server response.');
      const blob = await resp.blob();
      const disposition = resp.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"\\]+)"/);
      const fileName = match ? match[1] : `CFO-CRAFT-CV-${activeApplicationId}.pdf`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      $('verification-code').value = '';
      state = 'success';
      render();
    } catch (err) { showError(err.message || 'Could not download CV.'); }
    finally { downloadButton.disabled = false; }
  });
})();
