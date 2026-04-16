// ============================================================
// app.js — Main controller: state, routing, wiring
// ============================================================

// ── State ──────────────────────────────────────────────────
const STATE = {
  mes:     null,   // YYYY-MM
  view:    'global', // 'global' | 'focos'
  producto: 'Total', // for global chart drill-down
  foco:    null,   // for focos chart drill-down
};

// ── Boot ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  readHashState();
  attachEventListeners();
  populateFocoSelector();
  initApp();
});

async function initApp() {
  showLoading();
  hideError();
  try {
    const { months } = await loadData();
    populateMonthSelector(months);
    setLastUpdated(months);

    // Select month from state or default to latest
    if (STATE.mes && months.includes(STATE.mes)) {
      document.getElementById('month-select').value = STATE.mes;
    } else {
      STATE.mes = months[0] || null;
    }

    // Select foco default
    if (!STATE.foco) STATE.foco = CONFIG.FOCOS[0]?.id || null;
    const focoSel = document.getElementById('foco-select');
    if (focoSel && STATE.foco) focoSel.value = STATE.foco;

    render();
  } catch (err) {
    showError(err.message);
    console.error(err);
  } finally {
    hideLoading();
  }
}

// ── Main render ────────────────────────────────────────────

function render() {
  if (!STATE.mes) return;

  updateViewToggle();
  updateChartControls();
  writeHashState();

  if (STATE.view === 'global') {
    renderGlobalView();
  } else {
    renderFocosView();
  }
}

function renderGlobalView() {
  // Cards section: show total row
  const globalData = getGlobalForMonth(STATE.mes);
  document.getElementById('kpi-cards-section')?.classList.remove('hidden');
  renderKPICards(globalData.total, STATE.mes);
  renderSparklines('Total');

  // Table
  renderGlobalTable(globalData, STATE.mes);

  // Charts
  const productoSel = document.getElementById('producto-select');
  STATE.producto = productoSel?.value || 'Total';
  renderAllCharts('global', STATE.producto);
}

function renderFocosView() {
  // Hide summary cards in focos view
  document.getElementById('kpi-cards-section')?.classList.add('hidden');

  // Table
  const focosRows = getFocosForMonth(STATE.mes);
  renderFocosTable(focosRows, STATE.mes);

  // Charts — drill into selected foco
  renderAllCharts('focos', STATE.foco);
}

// ── Event listeners ────────────────────────────────────────

function attachEventListeners() {
  // Month selector
  document.getElementById('month-select')?.addEventListener('change', e => {
    STATE.mes = e.target.value;
    render();
  });

  // View toggle buttons
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.view = btn.dataset.view;
      render();
    });
  });

  // Producto selector (global chart)
  document.getElementById('producto-select')?.addEventListener('change', e => {
    STATE.producto = e.target.value;
    renderAllCharts('global', STATE.producto);
    writeHashState();
  });

  // Foco selector (focos chart)
  document.getElementById('foco-select')?.addEventListener('change', e => {
    STATE.foco = e.target.value;
    renderAllCharts('focos', STATE.foco);
    writeHashState();
  });

  // Refresh button
  document.getElementById('btn-refresh')?.addEventListener('click', async () => {
    showLoading();
    hideError();
    try {
      await loadData(true); // force refresh
      const { months } = await loadData();
      populateMonthSelector(months);
      setLastUpdated(months);
      if (!months.includes(STATE.mes)) STATE.mes = months[0];
      render();
    } catch (err) {
      showError(err.message);
    } finally {
      hideLoading();
    }
  });
}

// ── View toggle UI ─────────────────────────────────────────

function updateViewToggle() {
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.classList.toggle('view-btn--active', btn.dataset.view === STATE.view);
  });
}

function updateChartControls() {
  const globalControls = document.getElementById('chart-controls-global');
  const focosControls  = document.getElementById('chart-controls-focos');

  if (globalControls) globalControls.classList.toggle('hidden', STATE.view !== 'global');
  if (focosControls)  focosControls.classList.toggle('hidden',  STATE.view !== 'focos');
}

// ── URL hash state (shareable URLs) ───────────────────────

function writeHashState() {
  const params = new URLSearchParams();
  if (STATE.mes)     params.set('mes',      STATE.mes);
  if (STATE.view)    params.set('view',     STATE.view);
  if (STATE.view === 'global' && STATE.producto) params.set('producto', STATE.producto);
  if (STATE.view === 'focos'  && STATE.foco)     params.set('foco',     STATE.foco);
  history.replaceState(null, '', '#' + params.toString());
}

function readHashState() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) return;
  const params = new URLSearchParams(hash);
  if (params.has('mes'))      STATE.mes      = params.get('mes');
  if (params.has('view'))     STATE.view     = params.get('view');
  if (params.has('producto')) STATE.producto = params.get('producto');
  if (params.has('foco'))     STATE.foco     = params.get('foco');
}
