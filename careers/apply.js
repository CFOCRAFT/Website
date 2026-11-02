/* CFO CRAFT careers application frontend — live Render API connection. */
(() => {
  'use strict';
  const API_URL = 'https://api.cfocraft.com/api/careers/apply'; // Live CFO CRAFT Render backend.
  const MAX_BYTES = 5 * 1024 * 1024;
  const $ = (id) => document.getElementById(id);
  const catalog = Array.isArray(window.CFO_CAREER_ROLES) ? window.CFO_CAREER_ROLES : [];
  const roles = catalog.filter(item => item.status === 'open' && item.slug && item.title);
  const form = $('application-form');
  if (!form) return;

  // Small isolated navbar controller, without loading homepage dashboard scripts.
  const mobileButton = $('mobileMenuBtn');
  const links = document.querySelector('.nav-links');
  mobileButton?.setAttribute('aria-expanded', 'false');
  mobileButton?.setAttribute('aria-controls', 'applyNavLinks');
  mobileButton?.addEventListener('click', () => {
    const open = !links?.classList.contains('active');
    mobileButton.classList.toggle('active', open);
    links?.classList.toggle('active', open);
    mobileButton.setAttribute('aria-expanded', String(open));
    if (!open) document.querySelectorAll('.nav-dropdown-wrap.open').forEach(el => el.classList.remove('open'));
  });
  document.querySelectorAll('.nav-dropdown-wrap > .nav-link').forEach(link => {
    link.addEventListener('click', (event) => {
      if (window.innerWidth > 768) return;
      event.preventDefault();
      const parent = link.closest('.nav-dropdown-wrap');
      if (!parent) return;
      const open = !parent.classList.contains('open');
      document.querySelectorAll('.nav-dropdown-wrap.open').forEach(el => el.classList.remove('open'));
      parent.classList.toggle('open', open);
    });
  });
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('active');
    mobileButton?.classList.remove('active');
    mobileButton?.setAttribute('aria-expanded', 'false');
  }));

  const roleSelect = $('role');
  roleSelect.replaceChildren();
  const addOption = (value, title) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = title;
    roleSelect.appendChild(option);
  };
  addOption('general', 'General Application — Don’t see your role?');
  roles.forEach(role => addOption(role.slug, role.title));
  const request = new URLSearchParams(location.search).get('role') || 'general';
  roleSelect.value = roles.some(r => r.slug === request) ? request : 'general';
  const displayRole = () => {
    const chosen = roles.find(r => r.slug === roleSelect.value);
    $('role-summary').hidden = !chosen;
    $('role-hint').textContent = chosen ? 'Your application will be linked to this role.' : 'We will consider your profile for suitable future opportunities.';
    if (chosen) {
      $('role-summary-title').textContent = chosen.title;
      const location = String(chosen.location || '').replace(/\s*\[[^\]]*\]\s*$/, '').trim();
      const note = /\[[^\]]+\]/.test(String(chosen.location || '')) ? ' · Work arrangement to be confirmed' : '';
      $('role-summary-description').textContent = [chosen.type, location].filter(Boolean).join(' · ') + note;
    }
  };
  roleSelect.addEventListener('change', displayRole);
  displayRole();

  const note = $('note');
  note.addEventListener('input', () => { $('note-count').textContent = `${note.value.length} / 2000`; });
  const input = $('cv');
  const drop = $('upload-zone');
  let chosenFile = null;
  const fileIsPdf = async file => {
    if (!file || file.size < 5 || file.size > MAX_BYTES || !/\.pdf$/i.test(file.name)) return false;
    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    return String.fromCharCode(...header) === '%PDF-';
  };
  let fileCheckVersion = 0;
  const setFile = async file => {
    const version = ++fileCheckVersion;
    const valid = await fileIsPdf(file).catch(() => false);
    if (version !== fileCheckVersion) return;
    drop.classList.toggle('error', !valid);
    if (!valid) {
      chosenFile = null;
      input.value = '';
      $('cv-filename').textContent = 'Choose a PDF file';
      $('cv-message').textContent = 'Please select a valid PDF smaller than 5 MB.';
      return;
    }
    chosenFile = file;
    drop.classList.remove('error');
    $('cv-filename').textContent = file.name;
    $('cv-message').textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB · PDF ready to upload`;
  };
  input.addEventListener('change', async () => setFile(input.files?.[0]));
  // Native file selection with optional drag/drop.
  for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, event => { event.preventDefault(); drop.classList.add('drag-over'); });
  for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, event => { event.preventDefault(); drop.classList.remove('drag-over'); });
  drop.addEventListener('drop', async event => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    // Store the validated File object rather than relying on programmatic input.files assignment.
    await setFile(file);
  });

  const status = $('submit-status');
  let successHideTimer = null;
  const showStatus = (message, kind = 'error') => {
    if (successHideTimer !== null) {
      clearTimeout(successHideTimer);
      successHideTimer = null;
    }
    status.hidden = false;
    status.className = `apply-status ${kind}`;
    status.textContent = message;
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (kind === 'success' || kind === 'info') {
      successHideTimer = setTimeout(() => {
        status.hidden = true;
        status.textContent = '';
        successHideTimer = null;
      }, 5000);
    }
  };
  const submit = $('submit-application');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (successHideTimer !== null) {
      clearTimeout(successHideTimer);
      successHideTimer = null;
    }
    status.hidden = true;
    if (!form.reportValidity()) return;
    if (!chosenFile || !(await fileIsPdf(chosenFile).catch(() => false))) {
      showStatus('Please choose a valid PDF CV (maximum 5 MB).');
      input.focus();
      return;
    }
    if (!/^\+?[\d\s()\-]{8,25}$/.test($('phone').value.trim())) {
      showStatus('Enter a valid contact number.');
      $('phone').focus();
      return;
    }
    if (!API_URL) {
      showStatus('The application form is ready, but online CV submissions are not active yet. No details or CV have been sent.');
      return;
    }

    const payload = new FormData(form);
    payload.delete('cv');
    payload.set('cv', chosenFile, chosenFile.name);
    payload.set('role_slug', roleSelect.value);
    payload.set('privacy_consent', $('privacy_consent').checked ? 'true' : 'false');
    submit.disabled = true;
    submit.textContent = 'Submitting application…';
    try {
      const response = await fetch(API_URL, { method: 'POST', body: payload, headers: { 'Accept': 'application/json' }, credentials: 'omit' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.message || 'We could not submit your application. Please try again.');
      if (data.duplicate === true) {
        showStatus('You have already applied for this role using this email address. No new application was created or email notification sent. If you need to update your CV, please contact CFO CRAFT.', 'info');
        return;
      }
      showStatus('Your application was received successfully. Thank you for your interest in CFO CRAFT.', 'success');
      form.reset();
      chosenFile = null;
      drop.classList.remove('error');
      $('cv-filename').textContent = 'Choose a PDF file';
      $('cv-message').textContent = 'Click or drop your CV here · PDF only, up to 5 MB';
      $('note-count').textContent = '0 / 2000';
      roleSelect.value = roles.some(r => r.slug === request) ? request : 'general';
      displayRole();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : 'Unable to submit your application.');
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Submit application <span aria-hidden="true">→</span>';
    }
  });
})();
