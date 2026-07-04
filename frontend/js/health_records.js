/* ===================================================================
   Medfinity — Health Records page
=================================================================== */

const user = requireAuth(['patient', 'doctor', 'caregiver']);

const ICONS = {
  heart:    '<path d="M12 21s-8-4.5-8-11a5 5 0 019-3 5 5 0 019 3c0 6.5-8 11-8 11z"/>',
  upload:   '<path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>',
  records:  '<path d="M9 2h6l1 2h3v2H4V4h3l2-2zM6 8h12v12H6z"/>',
  pill:     '<path d="M4.5 10.5l7-7a3.5 3.5 0 015 5l-7 7a3.5 3.5 0 01-5-5z"/><path d="M8 8l5 5"/>',
  activity: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  calendar: '<path d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/>',
  file:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  drop:     '<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>',
  weight:   '<path d="M12 3a3 3 0 100 6 3 3 0 000-6z"/><path d="M20 21H4a1 1 0 01-1-1c0-4.4 3.6-8 8-8s8 3.6 8 8a1 1 0 01-1 1z"/>',
  eye:      '<path d="M1 12S4 4 12 4s11 8 11 8-3 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  sparkle:  '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15z"/>',
  x:        '<path d="M18 6L6 18M6 6l12 12"/>',
};
const icon = (name, attrs='') => `<svg ${attrs} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

/* ── Render Shell ───────────────────────────────────────── */
if (document.getElementById('app')) {
  document.getElementById('app').innerHTML = `
    ${renderSidebar('records', user.user_type === 'doctor' ? 'doctor' : 'patient')}
    <main class="main">
      ${renderTopbar({
        title: 'Health Records',
        sub: 'Your complete medical history, always at hand.',
        user
      })}

      <div class="bento" style="grid-template-columns:1fr;gap:20px;">

        <!-- Vitals summary row -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;" id="vitalsRow">
          ${skeletonVitalCards(5)}
        </div>

        <div class="grid-2col">

          <!-- Prescriptions -->
          <section class="tile" style="padding:20px 24px;">
            <div class="tile__head" style="margin-bottom:14px;">
              <h3>Prescriptions</h3>
              <span id="rxCount" style="font-size:12.5px;color:var(--ink-soft);font-weight:600;"></span>
            </div>
            <div class="list" id="rxList">${skeletonRows(3)}</div>
          </section>

          <!-- Appointment history -->
          <section class="tile" style="padding:20px 24px;">
            <div class="tile__head" style="margin-bottom:14px;">
              <h3>Visit History</h3>
            </div>
            <div class="list" id="visitList">${skeletonRows(3)}</div>
          </section>

        </div>

        <!-- Health records / documents -->
        <section class="tile" style="padding:20px 24px;">
          <div class="tile__head" style="margin-bottom:16px;">
            <h3>Medical Documents</h3>
            <button class="btn btn--primary btn--sm" id="uploadBtn">${icon('upload')} Upload Document</button>
          </div>

          <!-- Upload zone (hidden by default) -->
          <div class="upload-zone" id="uploadZone" style="display:none;margin-bottom:18px;">
            <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png" style="display:none;">
            ${icon('upload')}
            <p>Drag & drop or <strong style="color:var(--emerald-hover);cursor:pointer;" id="browseLabel">browse</strong> to upload</p>
            <span>PDF, JPG or PNG · max 10 MB</span>
            <div style="display:flex;gap:10px;justify-content:center;align-items:center;margin-top:16px;flex-wrap:wrap;">
              <select id="uploadRecordType" style="padding:8px 10px;border-radius:8px;border:1px solid var(--glass-border);font-size:12.5px;">
                <option value="lab_report">Lab Report</option>
                <option value="xray">X-Ray</option>
                <option value="mri">MRI</option>
                <option value="ct_scan">CT Scan</option>
                <option value="prescription">Prescription</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="vaccination">Vaccination Record</option>
                <option value="other" selected>Other</option>
              </select>
              <input type="date" id="uploadRecordDate" style="padding:8px 10px;border-radius:8px;border:1px solid var(--glass-border);font-size:12.5px;">
            </div>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">
              <button class="btn btn--primary btn--sm" id="confirmUpload" style="display:none;">${icon('upload')} Upload</button>
              <button class="btn btn--ghost btn--sm" id="cancelUpload">Cancel</button>
            </div>
            <div id="uploadFileName" style="font-size:12.5px;color:var(--emerald-hover);margin-top:8px;font-weight:600;"></div>
          </div>

          <div class="records-grid" id="docsGrid">${skeletonDocCards(4)}</div>
        </section>

        <!-- AI Document Tools: Prescription OCR + Report Summarizer -->
        <section class="tile" style="padding:20px 24px;">
          <div class="tile__head" style="margin-bottom:14px;">
            <h3 style="display:flex;align-items:center;gap:8px;">${icon('sparkle','style="color:var(--emerald);width:18px;height:18px;"')} AI Document Tools</h3>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
            <button class="btn btn--ghost" id="openOcrTool" style="justify-content:flex-start;padding:16px;height:auto;text-align:left;">
              <div>
                <div style="font-weight:700;color:var(--forest-deep);margin-bottom:4px;">${icon('pill','style="width:14px;height:14px;display:inline;margin-right:6px;"')} Prescription OCR</div>
                <div style="font-size:12px;color:var(--ink-soft);font-weight:500;">Upload a prescription photo — AI extracts medicines, dosage & duration.</div>
              </div>
            </button>
            <button class="btn btn--ghost" id="openSummarizeTool" style="justify-content:flex-start;padding:16px;height:auto;text-align:left;">
              <div>
                <div style="font-weight:700;color:var(--forest-deep);margin-bottom:4px;">${icon('file','style="width:14px;height:14px;display:inline;margin-right:6px;"')} Report Summarizer</div>
                <div style="font-size:12px;color:var(--ink-soft);font-weight:500;">Upload a lab report — AI translates medical jargon into plain language.</div>
              </div>
            </button>
          </div>
        </section>

        <!-- Conditions & allergies -->
        <div class="grid-2col">
          <section class="tile" style="padding:20px 24px;">
            <div class="tile__head" style="margin-bottom:14px;">
              <h3>Chronic Conditions</h3>
            </div>
            <div id="conditionsList" style="font-size:13.5px;color:var(--forest-deep);line-height:1.7;">${skeletonRows(1)}</div>
          </section>
          <section class="tile" style="padding:20px 24px;">
            <div class="tile__head" style="margin-bottom:14px;">
              <h3>Allergies</h3>
            </div>
            <div id="allergiesList" style="font-size:13.5px;color:var(--forest-deep);line-height:1.7;">${skeletonRows(1)}</div>
          </section>
        </div>

      </div>
    </main>

    <!-- AI Tool Modal (shared by OCR + Summarizer) -->
    <div class="modal-overlay" id="aiToolModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;align-items:center;justify-content:center;padding:20px;">
      <div class="tile" style="background:#fff;width:100%;max-width:560px;max-height:85vh;overflow-y:auto;padding:28px;border-radius:var(--radius-lg);position:relative;">
        <button id="closeAiToolModal" style="position:absolute;top:20px;right:20px;background:none;border:none;cursor:pointer;color:var(--ink-soft);">${icon('x','style="width:20px;height:20px;"')}</button>
        <h3 id="aiToolTitle" style="margin-bottom:6px;font-size:19px;color:var(--forest-deep);"></h3>
        <p id="aiToolSub" style="font-size:12.5px;color:var(--ink-soft);margin-bottom:16px;"></p>
        <input type="file" id="aiToolFile" accept=".jpg,.jpeg,.png" style="margin-bottom:14px;">
        <button class="btn btn--primary btn--block" id="aiToolRun">${icon('sparkle','style="width:14px;height:14px;"')} Analyze</button>
        <div id="aiToolResult" style="margin-top:18px;font-size:13.5px;color:var(--forest-deep);line-height:1.6;"></div>
      </div>
    </div>
  `;

  initPage();
}

/* ── Init ───────────────────────────────────────────────── */
function initPage() {
  loadVitals();
  loadPrescriptions();
  loadVisits();
  loadDocuments();
  loadProfile();
  setupUpload();
  setupAiTools();
}

/* ── AI Document Tools (Prescription OCR + Report Summarizer) ─── */
let aiToolMode = null; // 'ocr' | 'summarize'

function setupAiTools() {
  const modal   = document.getElementById('aiToolModal');
  const title   = document.getElementById('aiToolTitle');
  const sub     = document.getElementById('aiToolSub');
  const fileEl  = document.getElementById('aiToolFile');
  const runBtn  = document.getElementById('aiToolRun');
  const result  = document.getElementById('aiToolResult');

  const openModal = (mode) => {
    aiToolMode = mode;
    fileEl.value = '';
    result.innerHTML = '';
    if (mode === 'ocr') {
      title.textContent = 'Prescription OCR';
      sub.textContent = 'Upload a clear photo of a prescription. AI will extract the medicines, dosage and duration.';
    } else {
      title.textContent = 'Report Summarizer';
      sub.textContent = 'Upload a lab report or scan. AI will translate the medical jargon into plain language.';
    }
    modal.style.display = 'flex';
  };
  const closeModal = () => { modal.style.display = 'none'; aiToolMode = null; };

  document.getElementById('openOcrTool').addEventListener('click', () => openModal('ocr'));
  document.getElementById('openSummarizeTool').addEventListener('click', () => openModal('summarize'));
  document.getElementById('closeAiToolModal').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  runBtn.addEventListener('click', async () => {
    const file = fileEl.files[0];
    if (!file) { showToast('Choose an image first.', 'error'); return; }

    runBtn.disabled = true;
    const originalLabel = runBtn.innerHTML;
    runBtn.innerHTML = 'Analyzing…';
    result.innerHTML = `<div style="text-align:center;padding:12px 0;color:var(--ink-soft);">${skeletonRows(2)}</div>`;

    try {
      if (aiToolMode === 'ocr') {
        const data = await AiAPI.ocrPrescription(file);
        renderOcrResult(data);
      } else {
        const data = await AiAPI.summarizeReportImage(file);
        renderSummaryResult(data);
      }
    } catch (err) {
      result.innerHTML = `<div style="color:var(--danger);">${escapeHtml(err.message || 'Something went wrong. Please try a clearer image.')}</div>`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = originalLabel;
    }
  });
}

function renderOcrResult(data) {
  const result = document.getElementById('aiToolResult');
  const meds = data.medicines || [];
  const rows = meds.length
    ? meds.map(m => `
        <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--glass-border);">
          <div>
            <div style="font-weight:700;">${escapeHtml(m.name || 'Unnamed medicine')}</div>
            <div style="font-size:11.5px;color:var(--ink-soft);">${escapeHtml([m.frequency, m.duration].filter(Boolean).join(' · '))}</div>
          </div>
          <div style="font-size:12.5px;color:var(--emerald-hover);font-weight:700;white-space:nowrap;">${escapeHtml(m.dosage || '')}</div>
        </div>`).join('')
    : `<div style="color:var(--ink-soft);">No medicines could be confidently identified. Try a clearer, well-lit photo.</div>`;

  result.innerHTML = `
    ${data.patient_name || data.doctor_name ? `
      <div style="font-size:12px;color:var(--ink-soft);margin-bottom:10px;">
        ${data.doctor_name ? `Dr. ${escapeHtml(data.doctor_name)}` : ''} ${data.date ? `· ${escapeHtml(data.date)}` : ''}
      </div>` : ''}
    <div style="font-weight:700;margin-bottom:6px;">Extracted Medicines</div>
    ${rows}
    ${data.diagnosis ? `<div style="margin-top:12px;"><strong>Diagnosis:</strong> ${escapeHtml(data.diagnosis)}</div>` : ''}
    ${data.special_instructions ? `<div style="margin-top:6px;"><strong>Instructions:</strong> ${escapeHtml(data.special_instructions)}</div>` : ''}
  `;
}

function renderSummaryResult(data) {
  const result = document.getElementById('aiToolResult');
  const findings = data.key_findings || [];
  const abnormal = data.abnormal_values || [];
  const nextSteps = data.next_steps || [];
  result.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;">Summary</div>
    <p style="margin-bottom:12px;">${escapeHtml(data.summary || 'No summary available.')}</p>
    ${findings.length ? `<div style="font-weight:700;margin-bottom:6px;">Key Findings</div><ul style="margin:0 0 12px 18px;">${findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
    ${abnormal.length ? `<div style="font-weight:700;margin-bottom:6px;color:var(--danger);">Abnormal Values</div><ul style="margin:0 0 12px 18px;">${abnormal.map(f => `<li>${escapeHtml(typeof f === 'string' ? f : JSON.stringify(f))}</li>`).join('')}</ul>` : ''}
    ${nextSteps.length ? `<div style="font-weight:700;margin-bottom:6px;">Next Steps</div><ul style="margin:0 0 12px 18px;">${nextSteps.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
    <div style="font-size:11px;color:var(--ink-soft);border-top:1px solid var(--glass-border);padding-top:10px;margin-top:6px;">${escapeHtml(data.disclaimer || 'AI-generated interpretation — always confirm with your doctor.')}</div>
  `;
}

/* ── Vitals ─────────────────────────────────────────────── */
async function loadVitals() {
  const row = document.getElementById('vitalsRow');
  try {
    const v = await HealthAPI.latestVitals();
    const cards = [
      { icon: 'activity', label: 'Blood Pressure', val: v.blood_pressure || '—', unit: 'mmHg', bg: 'var(--rose-tint)', col: '#c0436b' },
      { icon: 'heart',    label: 'Heart Rate',     val: v.heart_rate    || '—', unit: 'bpm',  bg: 'var(--rose-tint)', col: '#c0436b' },
      { icon: 'drop',     label: 'Blood Group',    val: v.blood_group   || (user.blood_group || '—'), unit: '',     bg: 'var(--blue-tint)',  col: '#3b6fd1' },
      { icon: 'weight',   label: 'Weight',         val: v.weight        || '—', unit: 'kg',   bg: 'var(--peach-tint)', col: '#d98a3d' },
      { icon: 'eye',      label: 'Blood Sugar',    val: v.blood_sugar   || '—', unit: 'mg/dL',bg: 'var(--green-tint)', col: 'var(--emerald-hover)' },
    ];
    row.innerHTML = cards.map(c => `
      <div class="tile" style="padding:18px;gap:8px;background:${c.bg};border-color:transparent;">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;">
          ${icon(c.icon, `style="width:18px;height:18px;color:${c.col};"`)}
        </div>
        <div style="font-size:11.5px;font-weight:700;color:${c.col};text-transform:uppercase;letter-spacing:.05em;">${c.label}</div>
        <div style="font-size:26px;font-weight:800;color:var(--forest-deep);font-family:var(--font-display);line-height:1;">${escapeHtml(String(c.val))}</div>
        ${c.unit ? `<div style="font-size:11px;color:var(--ink-soft);font-weight:600;">${c.unit}</div>` : ''}
      </div>`).join('');
  } catch {
    const cards = [
      { label: 'Blood Pressure', val: '—' }, { label: 'Heart Rate', val: '—' },
      { label: 'Blood Group',    val: user.blood_group || '—' },
      { label: 'Weight',         val: '—' }, { label: 'Blood Sugar', val: '—' },
    ];
    row.innerHTML = cards.map(c => `
      <div class="tile" style="padding:18px;gap:8px;">
        <div style="font-size:11.5px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">${c.label}</div>
        <div style="font-size:26px;font-weight:800;color:var(--forest-deep);font-family:var(--font-display);">${escapeHtml(c.val)}</div>
      </div>`).join('');
  }
}

/* ── Prescriptions ──────────────────────────────────────── */
async function loadPrescriptions() {
  const list = document.getElementById('rxList');
  const count = document.getElementById('rxCount');
  try {
    const data = await PrescriptionsAPI.list();
    const items = data.results || data;
    count.textContent = `${items.length} total`;
    if (!items.length) { list.innerHTML = emptyState('No prescriptions yet', '', icon('pill')); return; }
    list.innerHTML = items.map(p => `
      <div class="list-row">
        <div class="list-row__icon" style="background:var(--lilac-tint);">${icon('pill', 'style="color:#7c5cbf;"')}</div>
        <div class="list-row__body">
          <div class="list-row__title">${escapeHtml(p.diagnosis || 'Prescription')}</div>
          <div class="list-row__meta">Dr. ${escapeHtml(p.doctor_name || 'Doctor')} · ${formatDate(p.created_at)}</div>
        </div>
        <span class="badge badge--${p.status || 'active'}">${(p.status || 'active').replace(/_/g,' ')}</span>
      </div>`).join('');
  } catch {
    list.innerHTML = emptyState("Couldn't load prescriptions", '', icon('pill'));
  }
}

/* ── Visit History ──────────────────────────────────────── */
async function loadVisits() {
  const list = document.getElementById('visitList');
  try {
    const data = await AppointmentsAPI.list();
    const items = (data.results || data).filter(a => a.status === 'completed').slice(0, 8);
    if (!items.length) { list.innerHTML = emptyState('No past visits', '', icon('calendar')); return; }
    list.innerHTML = items.map(a => `
      <div class="list-row">
        <div class="list-row__icon">${icon('calendar')}</div>
        <div class="list-row__body">
          <div class="list-row__title">Dr. ${escapeHtml(a.doctor_name || 'Doctor')}</div>
          <div class="list-row__meta">${escapeHtml(a.doctor_specialization || 'Specialist')} · ${formatDate(a.appointment_date)}</div>
        </div>
        <span class="badge badge--completed">Visited</span>
      </div>`).join('');
  } catch {
    list.innerHTML = emptyState("Couldn't load visits", '', icon('calendar'));
  }
}

/* ── Documents ──────────────────────────────────────────── */
async function loadDocuments() {
  const grid = document.getElementById('docsGrid');
  try {
    const data = await HealthAPI.records();
    const items = data.results || data;
    if (!items.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;">${emptyState('No documents yet', 'Upload your first medical document above.', icon('file'))}</div>`;
      return;
    }
    grid.innerHTML = items.map(r => `
      <div class="record-card" data-record-id="${r.id}">
        <div class="record-card__icon">${icon('file')}</div>
        <div class="record-card__title" title="${escapeHtml(r.title || r.record_type || 'Document')}">${escapeHtml(r.title || r.record_type || 'Document')}</div>
        <div class="record-card__sub">${formatDate(r.created_at || r.record_date || r.date)}</div>
        <div style="display:flex;gap:8px;align-self:flex-start;">
          ${r.file ? `<a class="btn btn--ghost btn--sm" href="${escapeHtml(r.file)}" target="_blank" rel="noopener">${icon('eye','style="width:13px;height:13px;"')} View</a>` : ''}
          <button class="btn btn--ghost btn--sm record-card__delete" data-record-id="${r.id}" title="Remove document" style="color:var(--danger);">${icon('x','style="width:12px;height:12px;"')} Remove</button>
        </div>
      </div>`).join('');

    grid.querySelectorAll('.record-card__delete').forEach(btn => {
      btn.addEventListener('click', () => deleteDocument(btn.dataset.recordId, btn));
    });
  } catch (err) {
    console.error('loadDocuments failed:', err);
    grid.innerHTML = `<div style="grid-column:1/-1;">${emptyState("Couldn't load documents", err?.message || 'Please refresh and try again.', icon('file'))}</div>`;
  }
}

async function deleteDocument(id, btn) {
  if (!confirm('Remove this document? This can\'t be undone.')) return;

  const card = btn.closest('.record-card');
  btn.disabled = true;
  btn.textContent = 'Removing…';

  try {
    await HealthAPI.deleteRecord(id);
    card.style.opacity = '0.4';
    card.remove();
    showToast('Document removed.', 'success');
    // Re-render the empty state if that was the last document.
    const grid = document.getElementById('docsGrid');
    if (!grid.querySelector('.record-card')) loadDocuments();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `${icon('x','style="width:12px;height:12px;"')} Remove`;
    showToast(err.message || "Couldn't remove that document.", 'error');
  }
}

/* ── Profile (conditions/allergies) ────────────────────── */
async function loadProfile() {
  try {
    const p = await UsersAPI.profile();
    const conditions = document.getElementById('conditionsList');
    const allergies  = document.getElementById('allergiesList');

    conditions.innerHTML = p.chronic_conditions
      ? p.chronic_conditions.split(',').map(c => c.trim()).filter(Boolean)
          .map(c => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--glass-border);">${icon('shield','style="width:14px;height:14px;color:var(--emerald-hover);"')} ${escapeHtml(c)}</div>`).join('')
      : emptyState('No conditions recorded', 'Your doctor will add these.', icon('shield'));

    allergies.innerHTML = p.allergies
      ? p.allergies.split(',').map(a => a.trim()).filter(Boolean)
          .map(a => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--glass-border);"><span style="width:8px;height:8px;border-radius:50%;background:var(--danger);flex-shrink:0;display:inline-block;"></span> ${escapeHtml(a)}</div>`).join('')
      : emptyState('No allergies recorded', '', icon('shield'));
  } catch {
    document.getElementById('conditionsList').innerHTML = emptyState("Couldn't load", '', icon('shield'));
    document.getElementById('allergiesList').innerHTML  = emptyState("Couldn't load", '', icon('shield'));
  }
}

/* ── Upload ─────────────────────────────────────────────── */
function setupUpload() {
  const btn    = document.getElementById('uploadBtn');
  const zone   = document.getElementById('uploadZone');
  const input  = document.getElementById('fileInput');
  const browse = document.getElementById('browseLabel');
  const cancel = document.getElementById('cancelUpload');
  const confirm= document.getElementById('confirmUpload');
  const fname  = document.getElementById('uploadFileName');

  const recordDateInput = document.getElementById('uploadRecordDate');
  if (recordDateInput && !recordDateInput.value) recordDateInput.value = new Date().toISOString().slice(0, 10);

  btn.addEventListener('click', () => { zone.style.display = 'block'; btn.style.display = 'none'; });
  cancel.addEventListener('click', () => { zone.style.display = 'none'; btn.style.display = ''; input.value = ''; fname.textContent = ''; confirm.style.display = 'none'; });
  browse.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    if (input.files[0]) {
      fname.textContent = input.files[0].name;
      confirm.style.display = 'inline-flex';
    }
  });

  ['dragover', 'dragenter'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.add('drag-over'); }));
  ['dragleave', 'drop'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.remove('drag-over'); }));
  zone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) { input.files = e.dataTransfer.files; fname.textContent = file.name; confirm.style.display = 'inline-flex'; }
  });

  confirm.addEventListener('click', async () => {
    if (!input.files[0]) return;
    confirm.disabled = true; confirm.textContent = 'Uploading…';
    const recordType = document.getElementById('uploadRecordType')?.value || 'other';
    const recordDate = document.getElementById('uploadRecordDate')?.value || new Date().toISOString().slice(0, 10);

    const form = new FormData();
    form.append('file', input.files[0]);
    form.append('title', input.files[0].name);
    form.append('record_type', recordType);
    form.append('record_date', recordDate);
    try {
      await apiCall('/health-records/', { method: 'POST', body: form });
      showToast('Document uploaded!', 'success');
      cancel.click();
      loadDocuments();
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
      confirm.disabled = false; confirm.textContent = 'Upload';
    }
  });
}

/* ── Skeleton helpers ───────────────────────────────────── */
function skeletonVitalCards(n) {
  return Array.from({length: n}).map(() => `
    <div class="tile" style="padding:18px;gap:8px;">
      <div class="skeleton" style="width:36px;height:36px;border-radius:10px;"></div>
      <div class="skeleton skel-line" style="width:60%;height:10px;"></div>
      <div class="skeleton skel-line" style="width:40%;height:22px;"></div>
    </div>`).join('');
}

function skeletonDocCards(n) {
  return Array.from({length: n}).map(() => `
    <div class="record-card" style="pointer-events:none;">
      <div class="skeleton" style="width:40px;height:40px;border-radius:10px;"></div>
      <div class="skeleton skel-line" style="width:70%;height:14px;"></div>
      <div class="skeleton skel-line" style="width:50%;height:11px;"></div>
    </div>`).join('');
}
