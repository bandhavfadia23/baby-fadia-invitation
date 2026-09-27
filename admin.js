const sb = supabase.createClient(SITE_CONFIG.SUPABASE_URL, SITE_CONFIG.SUPABASE_ANON_KEY);
const approved = (SITE_CONFIG.ADMIN_EMAILS || []).map(x => x.toLowerCase());
const el = id => document.getElementById(id);
const hide = id => el(id).classList.add('hidden');
const show = id => el(id).classList.remove('hidden');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function signIn() {
  el('authMessage').textContent = 'Opening Google sign-in...';
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/admin.html` }
  });
  if (error) el('authMessage').textContent = error.message;
}

async function signOut() {
  await sb.auth.signOut();
  location.replace('/admin.html');
}

async function loadDashboard() {
  el('dataMessage').textContent = 'Loading live Supabase data...';
  const [i, a, r] = await Promise.all([
    sb.from('invitations').select('id,primary_name,token,email,phone,category').order('primary_name'),
    sb.from('invitation_events').select('invitation_id,event_id'),
    sb.from('rsvps').select('invitation_id,adults,children')
  ]);
  const error = i.error || a.error || r.error;
  if (error) {
    el('dataMessage').textContent = error.message;
    return;
  }
  const invitations = i.data || [], links = a.data || [], rsvps = r.data || [];
  el('households').textContent = invitations.length;
  el('assignments').textContent = links.length;
  el('responses').textContent = rsvps.length;
  el('people').textContent = rsvps.reduce((sum, x) => sum + Number(x.adults || 0) + Number(x.children || 0), 0);
  el('inviteeRows').innerHTML = invitations.map(x => `<tr><td><b>${escapeHtml(x.primary_name)}</b></td><td>${escapeHtml(x.token)}</td><td>${escapeHtml(x.email || 'Optional')}</td><td>${escapeHtml(x.phone || '')}</td><td>${escapeHtml(x.category || '')}</td></tr>`).join('');
  el('dataMessage').textContent = invitations.length ? '' : 'No invitations found yet.';
}

async function routeSession(session) {
  hide('loginView'); hide('deniedView'); hide('dashboardView'); hide('signOut');
  if (!session) { show('loginView'); return; }
  const email = (session.user.email || '').toLowerCase();
  if (!approved.includes(email)) {
    el('deniedEmail').textContent = `Signed in as ${session.user.email}`;
    show('deniedView');
    return;
  }
  el('signedInAs').textContent = `Signed in as ${session.user.email}`;
  show('dashboardView'); show('signOut');
  await loadDashboard();
}

el('googleSignIn').addEventListener('click', signIn);
el('signOut').addEventListener('click', signOut);
el('deniedSignOut').addEventListener('click', signOut);
el('refresh').addEventListener('click', loadDashboard);
sb.auth.getSession().then(({ data }) => routeSession(data.session));
sb.auth.onAuthStateChange((_event, session) => routeSession(session));
