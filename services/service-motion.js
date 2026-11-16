(() => {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use the actual sticky navigation height instead of assuming one device size.
  const navbar = document.getElementById('navbar');
  const measureNav = () => {
    if (navbar) document.documentElement.style.setProperty('--service-screen-nav', `${Math.ceil(navbar.getBoundingClientRect().height)}px`);
  };
  measureNav();
  window.addEventListener('resize', measureNav, { passive:true });

  // One entrance per content group; individual interactive cards retain their
  // own hover / click transitions and are never disabled by this script.
  const targets = document.querySelectorAll(
    '.service-page main > section:not(.service-hero):not(.service-ladder) > .service-wrap, ' +
    '.service-page main > section:not(.service-hero):not(.service-ladder) > .service-final-wrap'
  );
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('service-motion-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold:0.08, rootMargin:'0px 0px -20px 0px' });

  if (!reducedMotion) targets.forEach((target) => {
    // Do not hide content when browser restores an existing scrolled position.
    const bounds = target.getBoundingClientRect();
    if (bounds.top < 0 || bounds.top < window.innerHeight * .85) return;
    target.classList.add('service-motion-reveal');
    observer.observe(target);
  });

  // FAQ rotation: 5s auto advance; a visitor's selection stays for 12s.
  const faq = document.querySelector('.service-page .service-faq');
  const questions = faq ? Array.from(faq.querySelectorAll('details')) : [];
  if (questions.length > 1) {
    let active = Math.max(0, questions.findIndex((item) => item.open));
    let visible = false;
    let manualUntil = 0;
    const choose = (index) => {
      active = index;
      questions.forEach((item, i) => { item.open = i === index; });
    };
    choose(active);
    questions.forEach((item, index) => {
      item.querySelector('summary')?.addEventListener('click', (event) => {
        event.preventDefault();
        choose(index);
        manualUntil = Date.now() + 12000;
      });
    });
    const faqObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
    }, { threshold: .2 });
    faqObserver.observe(faq);
    window.setInterval(() => {
      if (!visible || document.hidden || Date.now() < manualUntil) return;
      choose((active + 1) % questions.length);
    }, 5000);
  }
})();
