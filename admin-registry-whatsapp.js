(() => {
  const REGISTRY_URL = 'https://www.amazon.ca/baby-reg/bandhav-fadia-shreya-fadia-january-2027-brampton/BJLY8FL44WA7';
  window.openWhatsApp = function (id) {
    const family = state.invitations.find(x => x.id === id);
    if (!family?.phone) {
      alert('Add a phone number first.');
      return;
    }
    const inviteUrl = `${SITE_CONFIG.SITE_URL}/invite.html?token=${family.token}`;
    const message = `🎃 Important Celebration Update 🎃

Hi ${family.primary_name},

Our celebration dates have changed, and the Baby Shower venue has changed. Your previous RSVP is still saved. Please open your private invitation and reconfirm attendance.

Goyni
November 15, 2026 · 10:00 AM–12:00 PM

Srimant
November 22, 2026 · 9:00 AM
67 Bermondsey Way, Brampton

Baby Shower
November 22, 2026 · 5:00 PM–9:00 PM
Tandoori Tikka Lounge
232A Guelph St Unit 11-12, Georgetown, ON L7G 4B1

Your Invitation Code: ${family.token}
Open and reconfirm: ${inviteUrl}

Please reconfirm by November 1, 2026.

Love,
Bandhav & Shreya`;
    window.open(`https://wa.me/${family.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };
})();
