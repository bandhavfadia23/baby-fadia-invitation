(() => {
  const loadSheetJS = () => new Promise((resolve, reject) => {
    if (window.XLSX) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Excel export library could not load.'));
    document.head.appendChild(script);
  });

  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function addGuestDetails() {
    document.querySelectorAll('.family-row').forEach(row => {
      if (row.querySelector('.guest-details-v21')) return;
      const edit = row.querySelector('[data-edit]');
      if (!edit) return;
      const invitationId = edit.dataset.edit;
      const rsvp = state.rsvps.find(r => r.invitation_id === invitationId);
      if (!rsvp) return;
      const attendance = row.querySelector('.attendance');
      if (!attendance) return;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'guest-name-toggle-v21';
      toggle.textContent = 'View guest names';
      attendance.appendChild(toggle);
      const details = document.createElement('div');
      details.className = 'guest-details-v21 hidden';
      const names = Array.isArray(rsvp.guest_names) ? rsvp.guest_names : [];
      details.innerHTML = `<div><b>Attending names</b><ul>${names.length ? names.map(n => `<li>${safe(n)}</li>`).join('') : '<li>No individual names entered</li>'}</ul></div><div><b>RSVP notes</b><p>${safe(rsvp.notes || 'No notes')}</p></div>`;
      row.appendChild(details);
      toggle.onclick = () => {
        details.classList.toggle('hidden');
        toggle.textContent = details.classList.contains('hidden') ? 'View guest names' : 'Hide guest names';
      };
    });
  }

  const originalRenderFamilies = renderFamilies;
  renderFamilies = function () {
    originalRenderFamilies();
    addGuestDetails();
  };

  function selectedFamilies() {
    const event = state.events.find(e => e.id === state.selected);
    return { event, families: event ? invitationsForEvent(event.id) : state.invitations };
  }

  async function exportGuestExcel() {
    try {
      await loadSheetJS();
      const { event, families } = selectedFamilies();
      const summary = families.map(inv => {
        const rsvp = rsvpForInvitation(inv.id);
        return {
          'Family': inv.primary_name,
          'Invitation Code': inv.token,
          'Email': inv.email || '',
          'Phone': inv.phone || '',
          'Category': inv.category || '',
          'RSVP Status': statusFor(inv, state.selected),
          'Adults': rsvp?.adults || 0,
          'Children': rsvp?.children || 0,
          'Expected Total': attendanceFor(inv, state.selected),
          'Guest Names (as entered)': (rsvp?.guest_names || []).join(', '),
          'Notes': rsvp?.notes || '',
          'Assigned Events': state.assignments.filter(a => a.invitation_id === inv.id).map(a => state.events.find(e => e.id === a.event_id)?.name).filter(Boolean).join(', ')
        };
      });
      const seats = [];
      families.forEach(inv => {
        const rsvp = rsvpForInvitation(inv.id);
        if (!rsvp || statusFor(inv, state.selected) !== 'yes') return;
        const names = Array.isArray(rsvp.guest_names) ? rsvp.guest_names.filter(Boolean) : [];
        if (names.length) {
          names.forEach((name, index) => seats.push({
            'Seat #': '', 'Table #': '', 'Guest Name': name, 'Family': inv.primary_name,
            'Invitation Code': inv.token, 'Event': event?.name || 'All assigned events',
            'Guest Type': '', 'Meal / Dietary': '', 'Check-in': '', 'Notes': index === 0 ? (rsvp.notes || '') : ''
          }));
        } else {
          const total = Number(rsvp.adults || 0) + Number(rsvp.children || 0);
          for (let n = 1; n <= total; n++) seats.push({
            'Seat #': '', 'Table #': '', 'Guest Name': n === 1 ? rsvp.primary_name : `Guest ${n}`,
            'Family': inv.primary_name, 'Invitation Code': inv.token, 'Event': event?.name || 'All assigned events',
            'Guest Type': n <= Number(rsvp.adults || 0) ? 'Adult' : 'Child',
            'Meal / Dietary': '', 'Check-in': '', 'Notes': n === 1 ? (rsvp.notes || '') : ''
          });
        }
      });
      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      const seatSheet = XLSX.utils.json_to_sheet(seats);
      summarySheet['!cols'] = [{wch:24},{wch:16},{wch:24},{wch:18},{wch:18},{wch:14},{wch:9},{wch:10},{wch:15},{wch:34},{wch:30},{wch:35}];
      seatSheet['!cols'] = [{wch:9},{wch:9},{wch:26},{wch:24},{wch:16},{wch:24},{wch:13},{wch:22},{wch:12},{wch:30}];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Family Summary');
      XLSX.utils.book_append_sheet(workbook, seatSheet, 'Seat Assignment');
      XLSX.writeFile(workbook, `${event?.slug || 'all-families'}-guest-list.xlsx`);
    } catch (error) {
      managerMessage.textContent = error.message;
    }
  }

  const existingExport = document.getElementById('exportCsv');
  if (existingExport) {
    existingExport.textContent = 'Export Excel';
    const replacement = existingExport.cloneNode(true);
    replacement.id = 'exportExcel';
    existingExport.replaceWith(replacement);
    replacement.onclick = exportGuestExcel;
  }

  const style = document.createElement('style');
  style.textContent = `.family-row{position:relative}.guest-name-toggle-v21{display:block;margin-top:7px;border:0;background:none;color:var(--admin-rust);padding:0;font-weight:800;cursor:pointer;text-decoration:underline}.guest-details-v21{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:22px;background:#fbf4ee;border-radius:15px;padding:16px 20px;margin-top:4px}.guest-details-v21 ul{margin:8px 0;padding-left:20px}.guest-details-v21 p{margin:8px 0;color:var(--admin-muted)}@media(max-width:620px){.guest-details-v21{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  addGuestDetails();
})();
