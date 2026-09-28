(() => {
  const REGISTRY_URL = 'https://www.amazon.ca/baby-reg/bandhav-fadia-shreya-fadia-january-2027-brampton/BJLY8FL44WA7';
  const shell = document.getElementById('rsvpShell') || document.querySelector('.form-shell');
  if (!shell || document.getElementById('inviteRegistry')) return;
  const section = document.createElement('section');
  section.id = 'inviteRegistry';
  section.className = 'invite-registry';
  section.innerHTML = `
    <p class="eyebrow">BABY FADIA'S REGISTRY</p>
    <h2>Thank you for celebrating with us.</h2>
    <p>Your presence and blessings are more than enough. For family and friends who have asked, our Amazon registry is available below.</p>
    <a href="${REGISTRY_URL}" target="_blank" rel="noopener noreferrer">View Amazon Registry ↗</a>`;
  shell.insertAdjacentElement('afterend', section);
})();
