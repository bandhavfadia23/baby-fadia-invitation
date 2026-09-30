(() => {
  const REGISTRY_URL = 'https://www.amazon.ca/baby-reg/bandhav-fadia-shreya-fadia-january-2027-brampton/BJLY8FL44WA7';
  window.openWhatsApp = function (id) {
    const family = state.invitations.find(x => x.id === id);
    if (!family?.phone) {
      alert('Add a phone number first.');
      return;
    }
    const message = `🎃 Our Little Pumpkin 🎃\n\nHi ${family.primary_name},\n\nBandhav & Shreya would be delighted to celebrate with you.\n\nYour Invitation Code:\n${family.token}\n\n🌎 Explore Our Story & RSVP\n${SITE_CONFIG.SITE_URL}\n\n🎁 Baby Registry\n${REGISTRY_URL}\n\nYour presence and blessings are more than enough. For family and friends who have asked, we have created a small registry for Baby Fadia.\n\nRSVP Deadline: October 10, 2026\nCelebration Date: November 1, 2026\n\nLove,\nBandhav & Shreya`;
    window.open(`https://wa.me/${family.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };
})();
