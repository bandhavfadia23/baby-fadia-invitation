(() => {
  const REGISTRY_URL = 'https://www.amazon.ca/baby-reg/bandhav-fadia-shreya-fadia-january-2027-brampton/BJLY8FL44WA7';

  function fixDatePanel() {
    const panel = document.querySelector('.rsvp-art');
    if (!panel || panel.dataset.updated === 'true') return;
    panel.dataset.updated = 'true';
    panel.innerHTML = `
      <div class="date-block deadline-block">
        <span class="date-label">RSVP DEADLINE</span>
        <strong class="date-day">October 10</strong>
        <span class="date-year">2026</span>
      </div>
      <div class="date-divider" aria-hidden="true"></div>
      <div class="date-block celebration-block">
        <span class="date-label">CELEBRATION DATE</span>
        <strong class="date-day">November 1</strong>
        <span class="date-year">2026</span>
      </div>`;
  }

  function addRegistrySection() {
    if (document.getElementById('registry')) return;
    const gallery = document.getElementById('gallery');
    const closing = document.querySelector('.closing');
    const anchor = gallery || closing;
    if (!anchor) return;
    const section = document.createElement('section');
    section.id = 'registry';
    section.className = 'registry-section reveal shown';
    section.innerHTML = `
      <div class="registry-art" aria-hidden="true">
        <span class="registry-pumpkin">●</span>
        <span class="registry-gift">🎁</span>
      </div>
      <div class="registry-copy">
        <p class="eyebrow">BABY FADIA'S WISH LIST</p>
        <h2>A little help for<br><em>our little pumpkin.</em></h2>
        <p>Your presence and blessings are all we truly need. For family and friends who have asked, we have created a small registry for Baby Fadia.</p>
        <a class="registry-button" href="${REGISTRY_URL}" target="_blank" rel="noopener noreferrer">View Amazon Registry ↗</a>
      </div>`;
    anchor.insertAdjacentElement('afterend', section);

    const footerNav = document.querySelector('footer nav');
    if (footerNav && !footerNav.querySelector('a[href="#registry"]')) {
      const link = document.createElement('a');
      link.href = '#registry';
      link.textContent = 'Registry';
      footerNav.appendChild(link);
    }
  }

  function addExpectedArrival() {
    const hero = document.querySelector('.hero-copy');
    if (!hero || hero.querySelector('.arrival-chip')) return;
    const actions = hero.querySelector('.hero-actions');
    const chip = document.createElement('div');
    chip.className = 'arrival-chip';
    chip.innerHTML = '<span>Expected arrival</span><b>January 2027</b>';
    actions ? hero.insertBefore(chip, actions) : hero.appendChild(chip);
  }

  function addFaq() {
    if (document.getElementById('faq')) return;
    const registry = document.getElementById('registry');
    const closing = document.querySelector('.closing');
    if (!registry || !closing) return;
    const faq = document.createElement('section');
    faq.id = 'faq';
    faq.className = 'faq-section';
    faq.innerHTML = `
      <p class="eyebrow">GOOD TO KNOW</p>
      <h2>Celebration details</h2>
      <div class="faq-grid">
        <details open><summary>When is the celebration?</summary><p>The main celebrations are on November 1, 2026. Your private invitation shows the exact event, time and location assigned to your family.</p></details>
        <details><summary>What is the RSVP deadline?</summary><p>Please respond by October 10, 2026.</p></details>
        <details><summary>What should I wear?</summary><p>Your private invitation shows the attire for each celebration assigned to your family.</p></details>
        <details><summary>Is there a baby registry?</summary><p>Yes. The Amazon registry is available from the Registry section above.</p></details>
      </div>`;
    closing.insertAdjacentElement('beforebegin', faq);
  }

  fixDatePanel();
  addRegistrySection();
  addExpectedArrival();
  addFaq();
})();
