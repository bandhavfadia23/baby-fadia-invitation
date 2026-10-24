const db = supabase.createClient(SITE_CONFIG.SUPABASE_URL, SITE_CONFIG.SUPABASE_ANON_KEY);
const allowed = (SITE_CONFIG.ADMIN_EMAILS || []).map(x => x.toLowerCase());
const $ = id => document.getElementById(id);
const SITE_URL = SITE_CONFIG.SITE_URL || 'https://babyfadia.com';
const REGISTRY_URL = 'https://www.amazon.ca/baby-reg/bandhav-fadia-shreya-fadia-january-2027-brampton/BJLY8FL44WA7';
const RSVP_DEADLINE = 'November 7, 2026';

let state = {
  events: [], invitations: [], assignments: [], rsvps: [], responses: [],
  selected: 'all', editing: null
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

async function login() {
  authMessage.textContent = 'Opening Google sign-in...';
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${SITE_URL}/admin.html` }
  });
  if (error) authMessage.textContent = error.message;
}

async function logout() {
  await db.auth.signOut();
  location.replace('/admin.html');
}

async function route(session) {
  ['loginView', 'deniedView', 'appView', 'signOut'].forEach(hide);
  if (!session) { show('loginView'); return; }
  const email = (session.user.email || '').toLowerCase();
  if (!allowed.includes(email)) {
    deniedEmail.textContent = `Signed in as ${session.user.email}`;
    show('deniedView');
    return;
  }
  signedInAs.textContent = session.user.email;
  show('appView'); show('signOut');
  await loadAll();
}

async function loadAll() {
  managerMessage.textContent = 'Loading live data...';
  const [e, i, a, r, x] = await Promise.all([
    db.from('events').select('*').order('starts_at'),
    db.from('invitations').select('*').order('primary_name'),
    db.from('invitation_events').select('*'),
    db.from('rsvps').select('*'),
    db.from('rsvp_events').select('*')
  ]);
  const error = e.error || i.error || a.error || r.error || x.error;
  if (error) { managerMessage.textContent = error.message; return; }
  state.events = e.data || [];
  state.invitations = i.data || [];
  state.assignments = a.data || [];
  state.rsvps = r.data || [];
  state.responses = x.data || [];
  managerMessage.textContent = '';
  ensureDashboardUI();
  renderKpis();
  renderEventCards();
  renderFamilies();
  renderEventOptions();
}

function rsvpForInvitation(id) {
  return state.rsvps.find(r => r.invitation_id === id);
}
function responseFor(invitationId, eventId) {
  const r = rsvpForInvitation(invitationId);
  return r ? state.responses.find(x => x.rsvp_id === r.id && x.event_id === eventId) : null;
}
function invitationsForEvent(eventId) {
  const ids = new Set(state.assignments.filter(a => a.event_id === eventId).map(a => a.invitation_id));
  return state.invitations.filter(i => ids.has(i.id));
}
function statusFor(inv, eventId) {
  if (eventId === 'all') {
    const assigned = state.assignments.filter(a => a.invitation_id === inv.id);
    if (!assigned.length) return 'pending';
    const statuses = assigned.map(a => responseFor(inv.id, a.event_id)?.status || 'pending');
    return statuses.every(x => x === 'no') ? 'no' : statuses.some(x => x === 'yes') ? 'yes' : 'pending';
  }
  return responseFor(inv.id, eventId)?.status || 'pending';
}
function attendanceFor(inv, eventId) {
  const r = rsvpForInvitation(inv.id);
  if (!r || statusFor(inv, eventId) !== 'yes') return 0;
  return Number(r.adults || 0) + Number(r.children || 0);
}

function ensureDashboardUI() {
  if (!document.getElementById('reconfirmKpis')) {
    const section = document.createElement('section');
    section.id = 'reconfirmKpis';
    section.className = 'event-summary-grid';
    section.style.marginBottom = '22px';
    eventCards.insertAdjacentElement('beforebegin', section);
  }
  if (!statusFilter.querySelector('option[value="reconfirmed"]')) {
    statusFilter.insertAdjacentHTML('beforeend',
      '<option value="reconfirmed">Reconfirmed</option><option value="needs-reconfirm">Needs reconfirmation</option>');
  }
}

function renderKpis() {
  const invited = state.invitations.length;
  const received = state.rsvps.length;
  const reconfirmed = state.rsvps.filter(r => r.reconfirmed === true).length;
  const needs = state.rsvps.filter(r => r.reconfirmed !== true).length;
  const attendanceChanged = state.rsvps.filter(r => r.attendance_changed === true).length;
  const declined = state.invitations.filter(i => statusFor(i, 'all') === 'no').length;
  const cards = [
    ['Invited families', invited], ['RSVP received', received], ['Reconfirmed', reconfirmed],
    ['Needs reconfirmation', needs], ['Attendance changed', attendanceChanged], ['Declined', declined]
  ];
  $('reconfirmKpis').innerHTML = cards.map(([label, value], index) =>
    `<article class="event-summary" style="--event-accent:${['#9b4629','#d1a457','#578466','#c88238','#795888','#9d5148'][index]}">
      <small>DATE UPDATE</small><h3>${esc(label)}</h3><div class="event-count">${value}</div>
    </article>`).join('');
}

function renderEventCards() {
  const cards = [{ name: 'All families', id: 'all' }, ...state.events];
  eventCards.innerHTML = cards.map((e, index) => {
    const list = e.id === 'all' ? state.invitations : invitationsForEvent(e.id);
    const yes = list.filter(i => statusFor(i, e.id) === 'yes').length;
    const pending = list.filter(i => statusFor(i, e.id) === 'pending').length;
    const people = list.reduce((sum, i) => sum + attendanceFor(i, e.id), 0);
    const accent = ['#d29c80','#9b4629','#d1a457','#7d8a71'][index % 4];
    return `<button class="event-summary ${state.selected === e.id ? 'active' : ''}" data-event="${e.id}" style="--event-accent:${accent}">
      <small>${e.id === 'all' ? 'MASTER LIST' : new Date(e.starts_at).toLocaleDateString('en-CA',{month:'short',day:'numeric'})}</small>
      <h3>${esc(e.name)}</h3><div class="event-count">${list.length}</div>
      <div class="event-meta"><span>${yes} confirmed</span><span>${pending} pending</span><span>${people} people</span></div>
    </button>`;
  }).join('');
  document.querySelectorAll('[data-event]').forEach(b => b.onclick = () => {
    state.selected = b.dataset.event; statusFilter.value = 'all'; renderEventCards(); renderFamilies();
  });
}

function renderFamilies() {
  const event = state.events.find(e => e.id === state.selected);
  managerTitle.textContent = event ? event.name : 'All families';
  managerSubtitle.textContent = event ? `Families invited to ${event.name}.` : 'View every family and their invitation assignments.';
  let list = event ? invitationsForEvent(event.id) : [...state.invitations];
  const query = familySearch.value.trim().toLowerCase();
  const filter = statusFilter.value;
  list = list.filter(i => !query || [i.primary_name,i.token,i.phone,i.email,i.category].join(' ').toLowerCase().includes(query));
  list = list.filter(i => {
    if (filter === 'all') return true;
    const rsvp = rsvpForInvitation(i.id);
    if (filter === 'reconfirmed') return rsvp?.reconfirmed === true;
    if (filter === 'needs-reconfirm') return !!rsvp && rsvp.reconfirmed !== true;
    return statusFor(i, state.selected) === filter;
  });

  familiesGrid.innerHTML = list.length ? list.map(i => {
    const status = statusFor(i, state.selected);
    const rsvp = rsvpForInvitation(i.id);
    const count = attendanceFor(i, state.selected);
    const assigned = state.assignments.filter(a => a.invitation_id === i.id)
      .map(a => state.events.find(e => e.id === a.event_id)?.name).filter(Boolean);
    const reconfirmClass = rsvp?.reconfirmed ? 'status-yes' : 'status-pending';
    const reconfirmText = !rsvp ? 'No RSVP' : rsvp.reconfirmed ? 'Reconfirmed' : 'Needs reconfirmation';
    return `<article class="family-row">
      <div class="family-main"><b>${esc(i.primary_name)}</b><small>${assigned.map(esc).join(' · ') || 'No events assigned'}</small></div>
      <div><span class="code-pill">${esc(i.token)}</span></div>
      <div><span class="status-pill status-${status}">${status === 'yes' ? 'Confirmed' : status === 'no' ? 'Declined' : 'Pending'}</span><br><span class="status-pill ${reconfirmClass}">${reconfirmText}</span></div>
      <div class="attendance"><strong>${count || '—'}</strong><small>${rsvp ? `${rsvp.adults || 0} adults · ${rsvp.children || 0} children` : 'No RSVP'}</small></div>
      <div class="row-actions">
        <button class="icon-button" data-copy="${esc(i.token)}">Copy link</button>
        <button class="icon-button" data-wa-invite="${i.id}">WhatsApp Invite</button>
        <button class="icon-button" data-wa-update="${i.id}">Date & Venue Change</button>
        <button class="icon-button" data-edit="${i.id}">Edit</button>
      </div>
    </article>`;
  }).join('') : '<div class="empty-state">No families match this view.</div>';

  document.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => copyLink(b.dataset.copy));
  document.querySelectorAll('[data-wa-invite]').forEach(b => b.onclick = () => openNewInviteWhatsApp(b.dataset.waInvite));
  document.querySelectorAll('[data-wa-update]').forEach(b => b.onclick = () => openDateChangeWhatsApp(b.dataset.waUpdate));
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openFamily(b.dataset.edit));
}

function renderEventOptions() {
  eventOptions.innerHTML = state.events.map(e => `<label class="event-choice"><input type="checkbox" name="familyEvent" value="${e.id}"><span>${esc(e.name)}</span></label>`).join('');
}
function makeCode(name) { return name.toUpperCase().replace(/\bFAMILY\b/g,'').replace(/[^A-Z0-9]/g,'').slice(0,30); }
function updatePreview() {
  const code = familyCode.value.trim().toUpperCase() || 'CODE';
  linkPreview.textContent = `${SITE_URL}/invite.html?token=${code}`;
}
function openFamily(id = null) {
  state.editing = id; familyForm.reset(); formMessage.textContent = '';
  deleteFamily.classList.toggle('hidden', !id); dialogTitle.textContent = id ? 'Edit family' : 'Add family';
  if (id) {
    const i = state.invitations.find(x => x.id === id);
    familyId.value = i.id; familyName.value = i.primary_name; familyCode.value = i.token;
    familyCategory.value = i.category || 'Friends'; familyPhone.value = i.phone || ''; familyEmail.value = i.email || '';
    const ids = new Set(state.assignments.filter(a => a.invitation_id === id).map(a => a.event_id));
    document.querySelectorAll('[name=familyEvent]').forEach(x => x.checked = ids.has(x.value));
  } else {
    familyId.value = ''; familyCategory.value = 'Friends';
    document.querySelectorAll('[name=familyEvent]').forEach(x => x.checked = state.selected !== 'all' && x.value === state.selected);
  }
  updatePreview(); familyDialog.showModal();
}

async function saveFamilyRecord(event) {
  event.preventDefault();
  const eventIds = [...document.querySelectorAll('[name=familyEvent]:checked')].map(x => x.value);
  if (!eventIds.length) { formMessage.textContent = 'Select at least one event.'; return; }
  const code = familyCode.value.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,30}$/.test(code)) { formMessage.textContent = 'Code must use 2–30 letters, numbers or hyphens.'; return; }
  saveFamily.disabled = true; formMessage.textContent = 'Saving...';
  const { error } = await db.rpc('admin_upsert_household', {
    p_id: familyId.value || null, p_name: familyName.value.trim(), p_token: code,
    p_email: familyEmail.value.trim() || null, p_phone: familyPhone.value.trim() || null,
    p_category: familyCategory.value, p_event_ids: eventIds
  });
  saveFamily.disabled = false;
  if (error) { formMessage.textContent = error.message; return; }
  familyDialog.close(); await loadAll();
}

async function removeFamily() {
  if (!state.editing || !confirm('Delete this family, event assignments and RSVP? This cannot be undone.')) return;
  deleteFamily.disabled = true;
  const { error } = await db.rpc('admin_delete_household', { p_id: state.editing });
  deleteFamily.disabled = false;
  if (error) { formMessage.textContent = error.message; return; }
  familyDialog.close(); await loadAll();
}

async function copyLink(code) {
  await navigator.clipboard.writeText(`${SITE_URL}/invite.html?token=${code}`);
  managerMessage.textContent = `Invitation link copied for ${code}.`;
  setTimeout(() => managerMessage.textContent = '', 2500);
}
function getFamily(id) {
  const family = state.invitations.find(x => x.id === id);
  if (!family?.phone) { alert('Add a phone number first.'); return null; }
  return family;
}
function openWhatsAppMessage(family, message) {
  window.open(`https://wa.me/${family.phone.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`, '_blank');
}
function openNewInviteWhatsApp(id) {
  const family = getFamily(id); if (!family) return;
  const inviteUrl = `${SITE_URL}/invite.html?token=${family.token}`;
  const message = `🎃 Our Little Pumpkin 🎃\n\nHi ${family.primary_name},\n\nBandhav & Shreya would be delighted to celebrate with you.\n\nYour private invitation code: ${family.token}\nOpen your invitation and RSVP: ${inviteUrl}\n\nGoyni\nNovember 15, 2026 · 10:00 AM–12:00 PM\n\nSrimant\nNovember 22, 2026 · 9:00 AM\n\nBaby Shower\nNovember 22, 2026 · 5:00 PM–9:00 PM\nTandoori Tikka Lounge\n232A Guelph St Unit 11-12, Georgetown, ON L7G 4B1\n\nPlease RSVP by ${RSVP_DEADLINE}.\n\nBaby Registry: ${REGISTRY_URL}\n\nLove,\nBandhav & Shreya`;
  openWhatsAppMessage(family, message);
}
function openDateChangeWhatsApp(id) {
  const family = getFamily(id); if (!family) return;
  const inviteUrl = `${SITE_URL}/invite.html?token=${family.token}`;
  const message = `📢 Important Date & Venue Update\n\nHi ${family.primary_name},\n\nOur celebration dates have changed, and the Baby Shower venue has changed. Your previous RSVP is still saved. Please review the updated details and reconfirm attendance.\n\nGoyni\nNovember 15, 2026 · 10:00 AM–12:00 PM\n67 Bermondsey Way, Brampton\n\nSrimant\nNovember 22, 2026 · 9:00 AM\n67 Bermondsey Way, Brampton\n\nBaby Shower\nNovember 22, 2026 · 5:00 PM–9:00 PM\nTandoori Tikka Lounge\n232A Guelph St Unit 11-12, Georgetown, ON L7G 4B1\n\nReconfirm by ${RSVP_DEADLINE}: ${inviteUrl}\n\nInvitation code: ${family.token}\n\nThank you for your love and understanding.\n\nLove,\nBandhav & Shreya`;
  openWhatsAppMessage(family, message);
}
// Compatibility for any older extension script that calls openWhatsApp().
window.openWhatsApp = openNewInviteWhatsApp;
window.openNewInviteWhatsApp = openNewInviteWhatsApp;
window.openDateChangeWhatsApp = openDateChangeWhatsApp;

function exportData() {
  const event = state.events.find(e => e.id === state.selected);
  const list = event ? invitationsForEvent(event.id) : state.invitations;
  const rows = [[
    'Family','Code','Email','Phone','Category','Status','Expected people','Reconfirmed','Reconfirmed at','Attendance changed','Events'
  ], ...list.map(i => {
    const r = rsvpForInvitation(i.id);
    return [i.primary_name,i.token,i.email || '',i.phone || '',i.category || '',statusFor(i,state.selected),
      attendanceFor(i,state.selected),r?.reconfirmed ? 'Yes' : 'No',r?.reconfirmed_at || '',
      r?.attendance_changed ? 'Yes' : 'No',state.assignments.filter(a => a.invitation_id === i.id)
        .map(a => state.events.find(e => e.id === a.event_id)?.name).filter(Boolean).join('; ')];
  })];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = `${event?.slug || 'all'}-families.csv`; a.click(); URL.revokeObjectURL(a.href);
}

googleSignIn.onclick = login;
signOut.onclick = logout;
deniedSignOut.onclick = logout;
addFamily.onclick = () => openFamily();
closeDialog.onclick = cancelDialog.onclick = () => familyDialog.close();
familyName.oninput = () => { if (!state.editing) familyCode.value = makeCode(familyName.value); updatePreview(); };
familyCode.oninput = () => { familyCode.value = familyCode.value.toUpperCase(); updatePreview(); };
familyForm.onsubmit = saveFamilyRecord;
deleteFamily.onclick = removeFamily;
familySearch.oninput = renderFamilies;
statusFilter.onchange = renderFamilies;
refreshData.onclick = loadAll;
exportCsv.onclick = exportData;
db.auth.getSession().then(({data}) => route(data.session));
db.auth.onAuthStateChange((_event, session) => route(session));
