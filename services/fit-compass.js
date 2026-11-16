/* CFO CRAFT — shared Fit Compass for all five service pages.
   Reads each page's existing lists, preserving unique copy and links. */
(() => {
  const init = () => {
    const original = document.querySelector('.service-page .service-fit');
    if (!original || original.dataset.fitEnhanced) return;
    const sections = [original.querySelector('.yes'), original.querySelector('.no')];
    if (sections.some(section => !section?.querySelector('ul'))) return;

    const compass = document.createElement('section');
    compass.className = 'fit-compass';
    compass.setAttribute('aria-label', 'Is this service right for you?');
    compass.innerHTML = `
      <div class="fit-compass-heading">
        <span class="fit-compass-eyebrow">A CLEARER WAY TO DECIDE</span>
        <span class="fit-compass-hint">Explore both sides to find your fit.</span>
      </div>
      <div class="fit-compass-options" role="group" aria-label="Compare suitability">
        <button type="button" class="fit-compass-option" aria-pressed="true" aria-controls="fit-compass-details" data-fit-index="0">
          <span class="fit-compass-icon" aria-hidden="true">✓</span>
          <span class="fit-compass-option-text"><strong>Good Fit</strong><small>Where strategic CFO support adds value.</small><em>EXPLORE ↗</em></span>
        </button>
        <button type="button" class="fit-compass-option" aria-pressed="false" aria-controls="fit-compass-details" data-fit-index="1">
          <span class="fit-compass-icon" aria-hidden="true">⊖</span>
          <span class="fit-compass-option-text"><strong>Not the Right Fit</strong><small>When another solution may serve you better.</small><em>EXPLORE ↗</em></span>
        </button>
        <span class="fit-compass-vs" aria-hidden="true">VS</span>
      </div>
      <div class="fit-compass-track" aria-hidden="true"><span class="fit-compass-track-fill"></span></div>
      <div id="fit-compass-details" class="fit-compass-details" role="region" aria-live="polite"></div>`;
    original.before(compass);
    const options = [...compass.querySelectorAll('[data-fit-index]')];
    const details = compass.querySelector('.fit-compass-details');
    const fill = compass.querySelector('.fit-compass-track-fill');

    const activate = index => {
      options.forEach((button, position) => {
        button.setAttribute('aria-pressed', String(index === position));
      });
      fill.style.transform = `translateX(${index * 100}%)`;
      details.classList.toggle('fit-compass-negative', index === 1);
      const source = sections[index];
      const title = source.querySelector('h3')?.textContent.trim() || (index ? 'Not the right fit if' : 'A good fit if');
      const list = source.querySelector('ul');
      // Take trusted page-authored markup so existing inline links remain usable.
      details.innerHTML = `<div class="fit-compass-details-inner"><div class="fit-compass-detail-top"><span>${index ? 'WHEN ANOTHER APPROACH FITS' : 'WHERE CFO CRAFT ADDS VALUE'}</span><b>${index ? 'HONEST ADVICE' : 'GOOD FIT'}</b></div><h3></h3><ul></ul></div>`;
      details.querySelector('h3').textContent = title;
      details.querySelector('ul').innerHTML = list.innerHTML;
    };
    options.forEach((button, index) => button.addEventListener('click', () => activate(index)));
    activate(0);
    original.dataset.fitEnhanced = 'true';
    original.classList.add('fit-compass-original-hidden');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
