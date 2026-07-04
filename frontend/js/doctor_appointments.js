/* ===================================================================
   Medfinity — Doctor Appointments
   Lets a doctor view, filter and manage their own appointment queue
   (confirm, start, complete, mark no-show, or cancel).
=================================================================== */

const user = requireAuth(['doctor']);

const ICONS = {
  calendar: '<path d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/>',
  video: '<path d="M15 10l5-3v10l-5-3M3 6h12v12H3z"/>',
  records: '<path d="M9 2h6l1 2h3v2H4V4h3l2-2zM6 8h12v12H6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/>',
};
const icon = (name, attrs='') => `<svg ${attrs} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const FILTERS = [
  { key: 'upcoming',  label: 'Upcoming',  test: a => ['scheduled', 'confirmed', 'in_progress'].includes(a.status) },
  { key: 'completed', label: 'Completed', test: a => a.status === 'completed' },
  { key: 'cancelled', label: 'Cancelled / No-show', test: a => ['cancelled', 'no_show'].includes(a.status) },
  { key: 'all',       label: 'All', test: () => true },
];

let allAppointments = [];
let activeFilter = 'upcoming';

if (document.getElementById('app')) {
  document.getElementById('app').innerHTML = `
    ${renderSidebar('appointments', 'doctor')}
    <main class="main">
      ${renderTopbar({
        title: 'Appointments',
        sub: 'Manage your schedule — confirm, start, complete or cancel visits.',
        user,
        hideSearch: true
      })}

      <div class="bento" style="grid-template-columns:1fr; gap:20px;">
        <section class="tile" style="padding:20px 24px;">
          <div class="tile__head" style="margin-bottom:6px;"><h3>Your Appointment Queue</h3><span class="tile-link" id="apptCount"></span></div>
          <div class="filter-tabs" id="apptFilters" style="margin:14px 0 18px;"></div>
          <div class="list" id="apptList">${skeletonRows(5)}</div>
        </section>

        <!-- Weekly availability manager -->
        <section class="tile" style="padding:20px 24px;">
          <div class="tile__head" style="margin-bottom:6px;">
            <h3 style="display:flex;align-items:center;gap:8px;">${icon('clock','style="width:18px;height:18px;color:var(--emerald);"')} My Weekly Availability</h3>
          </div>
          <p style="font-size:12.5px;color:var(--ink-soft);margin:0 0 16px;">Set the recurring time windows you're bookable in — patients will see these as pickable slots when booking with you.</p>

          <form id="availabilityForm" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:18px;">
            <div class="field" style="margin-bottom:0;min-width:140px;">
              <label for="availDay">Day</label>
              <select id="availDay">
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <div class="field" style="margin-bottom:0;">
              <label for="availStart">Start time</label>
              <input type="time" id="availStart" required value="09:00">
            </div>
            <div class="field" style="margin-bottom:0;">
              <label for="availEnd">End time</label>
              <input type="time" id="availEnd" required value="09:30">
            </div>
            <button type="submit" class="btn btn--primary btn--sm" id="addAvailBtn">${icon('plus','style="width:13px;height:13px;"')} Add Slot</button>
          </form>
          <div id="availabilityFormError" class="form-error"></div>

          <div id="availabilityList">${skeletonRows(2)}</div>
        </section>
      </div>
    </main>
  `;

  initPage();
}

function initPage() {
  loadAppointments();
  loadAvailability();
  document.getElementById('availabilityForm').addEventListener('submit', handleAddAvailability);
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

async function loadAvailability() {
  const list = document.getElementById('availabilityList');
  try {
    const data = await UsersAPI.doctorAvailability(user.id);
    const slots = data.results || data;
    renderAvailability(slots);
  } catch {
    list.innerHTML = emptyState("Couldn't load your availability", '', icon('clock'));
  }
}

function renderAvailability(slots) {
  const list = document.getElementById('availabilityList');
  if (!slots.length) {
    list.innerHTML = emptyState('No availability set yet', 'Add your first slot above so patients can book you.', icon('clock'));
    return;
  }

  const grouped = {};
  slots.forEach(s => { (grouped[s.day] = grouped[s.day] || []).push(s); });

  list.innerHTML = DAY_ORDER.filter(d => grouped[d]).map(day => `
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;text-transform:capitalize;color:var(--ink-soft);margin-bottom:6px;">${day}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${grouped[day].map(s => `
          <span class="badge badge--scheduled" style="display:inline-flex;align-items:center;gap:6px;padding:6px 6px 6px 12px;font-size:12px;">
            ${icon('clock','style="width:12px;height:12px;"')} ${formatTime(s.start_time)} – ${formatTime(s.end_time)}
            <button data-avail-id="${s.id}" title="Remove slot" style="background:none;border:none;cursor:pointer;color:inherit;display:flex;align-items:center;padding:2px;opacity:.7;">${icon('trash','style="width:12px;height:12px;"')}</button>
          </span>`).join('')}
      </div>
    </div>`).join('');

  list.querySelectorAll('[data-avail-id]').forEach(btn => {
    btn.addEventListener('click', () => deleteAvailability(btn.dataset.availId));
  });
}

async function handleAddAvailability(e) {
  e.preventDefault();
  const btn = document.getElementById('addAvailBtn');
  const errBox = document.getElementById('availabilityFormError');
  errBox.classList.remove('is-visible');

  const day = document.getElementById('availDay').value;
  const start_time = document.getElementById('availStart').value;
  const end_time = document.getElementById('availEnd').value;

  if (end_time <= start_time) {
    errBox.textContent = 'End time must be after start time.';
    errBox.classList.add('is-visible');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `${icon('clock','style="width:13px;height:13px;"')} Adding…`;
  try {
    await UsersAPI.createAvailability(user.id, { day, start_time, end_time });
    showToast('Availability slot added.', 'success');
    loadAvailability();
  } catch (err) {
    errBox.textContent = err.message || 'Could not add that slot.';
    errBox.classList.add('is-visible');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${icon('plus','style="width:13px;height:13px;"')} Add Slot`;
  }
}

async function deleteAvailability(id) {
  if (!confirm('Remove this availability slot?')) return;
  try {
    await UsersAPI.deleteAvailability(id);
    showToast('Slot removed.', 'default');
    loadAvailability();
  } catch (err) {
    showToast(err.message || "Couldn't remove that slot.", 'error');
  }
}

async function loadAppointments() {
  const list = document.getElementById('apptList');
  try {
    const data = await AppointmentsAPI.list();
    allAppointments = data.results || data;
    renderFilters();
    renderList();
  } catch (err) {
    list.innerHTML = emptyState("Couldn't load appointments", err.message, icon('calendar'));
  }
}

function renderFilters() {
  const wrap = document.getElementById('apptFilters');
  wrap.innerHTML = FILTERS.map(f => {
    const n = allAppointments.filter(f.test).length;
    return `<button type="button" class="filter-tab${f.key === activeFilter ? ' is-active' : ''}" data-f="${f.key}">${f.label} <span class="count">${n}</span></button>`;
  }).join('');
  wrap.querySelectorAll('[data-f]').forEach(btn => {
    btn.addEventListener('click', () => { activeFilter = btn.dataset.f; renderFilters(); renderList(); });
  });
}

function renderList() {
  const list = document.getElementById('apptList');
  const countEl = document.getElementById('apptCount');
  const filterDef = FILTERS.find(f => f.key === activeFilter) || FILTERS[0];
  const items = allAppointments.filter(filterDef.test)
    .sort((a, b) => `${a.appointment_date} ${a.appointment_time}`.localeCompare(`${b.appointment_date} ${b.appointment_time}`));
  countEl.textContent = `${allAppointments.length} total`;

  if (!items.length) {
    list.innerHTML = emptyState('Nothing here', 'Appointments matching this filter will show up here.', icon('calendar'));
    return;
  }

  list.innerHTML = items.map(a => {
    const actions = [];
    if (a.status === 'scheduled') actions.push(`<button class="btn btn--sage btn--sm" data-status="${a.id}" data-next="confirmed">Confirm</button>`);
    if (a.status === 'scheduled' || a.status === 'confirmed') actions.push(`<button class="btn btn--ghost btn--sm" data-status="${a.id}" data-next="in_progress">Start</button>`);
    if (['scheduled', 'confirmed', 'in_progress'].includes(a.status)) actions.push(`<button class="btn btn--primary btn--sm" data-status="${a.id}" data-next="completed">Complete</button>`);
    if (['scheduled', 'confirmed'].includes(a.status)) actions.push(`<button class="btn btn--ghost btn--sm" data-status="${a.id}" data-next="no_show">No-show</button>`);
    if (['scheduled', 'confirmed'].includes(a.status)) actions.push(`<button class="btn btn--ghost btn--sm" data-cancel="${a.id}" style="border-color:var(--danger);color:var(--danger);">Cancel</button>`);
    if (a.appointment_type === 'video' && ['confirmed', 'in_progress'].includes(a.status)) actions.push(`<a class="btn btn--sage btn--sm" href="video_consult.html">${icon('video','style="width:13px;height:13px;"')} Join</a>`);

    return `
    <div class="list-row" style="align-items:flex-start;flex-wrap:wrap;gap:14px;padding:16px 6px;">
      <div class="list-row__icon">${icon('calendar')}</div>
      <div class="list-row__body" style="flex:1 1 220px;">
        <div class="list-row__title">${escapeHtml(a.patient_name || 'Patient')}</div>
        <div class="list-row__meta">${formatDate(a.appointment_date)} · ${formatTime(a.appointment_time)} · ${a.appointment_type === 'video' ? 'Video' : 'In-person'}</div>
        ${a.symptoms ? `<div class="list-row__meta" style="margin-top:2px;">Reason: ${escapeHtml(a.symptoms)}</div>` : ''}
      </div>
      <span class="badge badge--${a.status}">${a.status.replace(/_/g,' ')}</span>
      <a class="btn btn--ghost btn--sm" href="patient_records.html?patient=${a.patient_id}">${icon('records','style="width:13px;height:13px;"')} Records</a>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${actions.join('')}</div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await AppointmentsAPI.updateStatus(btn.dataset.status, btn.dataset.next);
        showToast('Appointment updated', 'success');
        loadAppointments();
      } catch (err) { showToast(err.message, 'error'); btn.disabled = false; }
    });
  });
  list.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Cancel this appointment?')) return;
      btn.disabled = true;
      try {
        await AppointmentsAPI.cancel(btn.dataset.cancel);
        showToast('Appointment cancelled', 'default');
        loadAppointments();
      } catch (err) { showToast(err.message, 'error'); btn.disabled = false; }
    });
  });
}
