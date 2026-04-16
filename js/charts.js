// ============================================================
// charts.js — All Chart.js chart definitions
// ============================================================

// Keep references so we can destroy and recreate on update
const _charts = {};

// ── Shared Chart.js defaults ──────────────────────────────

Chart.defaults.font.family = "'Inter', 'system-ui', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = CONFIG.COLORS.textMuted;

const SHARED_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, pointStyleWidth: 8, padding: 16 },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: { color: CONFIG.COLORS.gridLine },
      ticks: { maxRotation: 0 },
    },
    y: {
      grid: { color: CONFIG.COLORS.gridLine },
      beginAtZero: true,
    },
  },
};

// ── Sparklines (KPI cards) ─────────────────────────────────

/**
 * Renders mini sparklines inside each KPI card.
 * @param {string} producto - 'Dentalink' | 'Medilink' | 'Total'
 */
function renderSparklines(producto) {
  const history = getGlobalHistory(producto === 'Total' ? 'Total' : producto);
  const recent  = history.slice(-CONFIG.SPARKLINE_MONTHS);
  const labels  = recent.map(r => FMT.mes(r.mes));

  Object.entries(CONFIG.METRICS).forEach(([key, m]) => {
    const canvasId = `sparkline-${key}`;
    const canvas   = document.getElementById(canvasId);
    if (!canvas) return;

    if (_charts[canvasId]) { _charts[canvasId].destroy(); }

    const color = CONFIG.COLORS.dentalink;

    _charts[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data:            recent.map(r => r[m.realKey]),
          borderColor:     color,
          backgroundColor: 'transparent',
          borderWidth:     2,
          pointRadius:     2,
          tension:         0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales:  { x: { display: false }, y: { display: false, beginAtZero: false } },
        animation: false,
      },
    });
  });
}

// ── nMQL line chart ────────────────────────────────────────

function renderNMQLChart(historyRows, label, color) {
  destroyChart('chart-nmql');
  const canvas = document.getElementById('chart-nmql');
  if (!canvas || !historyRows.length) return;

  const labels = historyRows.map(r => FMT.mes(r.mes));

  _charts['chart-nmql'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label:           `nMQL Real (${label})`,
          data:            historyRows.map(r => r.nmql_real),
          borderColor:     color,
          backgroundColor: color + '20',
          fill:            true,
          borderWidth:     2,
          pointRadius:     4,
          tension:         0.3,
        },
        {
          label:           'Objetivo',
          data:            historyRows.map(r => r.nmql_target),
          borderColor:     CONFIG.COLORS.target,
          borderDash:      [6, 3],
          borderWidth:     2,
          pointRadius:     0,
          fill:            false,
        },
      ],
    },
    options: {
      ...SHARED_OPTS,
      plugins: {
        ...SHARED_OPTS.plugins,
        title: { display: true, text: 'nMQL — Real vs Objetivo', font: { size: 14, weight: '600' } },
      },
    },
  });
}

// ── nMQL Calificados line chart ────────────────────────────

function renderNMQLCalChart(historyRows, label, color) {
  destroyChart('chart-nmql-cal');
  const canvas = document.getElementById('chart-nmql-cal');
  if (!canvas || !historyRows.length) return;

  const labels = historyRows.map(r => FMT.mes(r.mes));

  _charts['chart-nmql-cal'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label:           `nMQL Cal. Real (${label})`,
          data:            historyRows.map(r => r.nmql_cal_real),
          borderColor:     color,
          backgroundColor: color + '20',
          fill:            true,
          borderWidth:     2,
          pointRadius:     4,
          tension:         0.3,
        },
        {
          label:           'Objetivo',
          data:            historyRows.map(r => r.nmql_cal_target),
          borderColor:     CONFIG.COLORS.target,
          borderDash:      [6, 3],
          borderWidth:     2,
          pointRadius:     0,
          fill:            false,
        },
      ],
    },
    options: {
      ...SHARED_OPTS,
      plugins: {
        ...SHARED_OPTS.plugins,
        title: { display: true, text: 'nMQL Calificados — Real vs Objetivo', font: { size: 14, weight: '600' } },
      },
    },
  });
}

// ── nMRR bar + line chart ─────────────────────────────────

function renderNMRRChart(historyRows, label, color) {
  destroyChart('chart-nmrr');
  const canvas = document.getElementById('chart-nmrr');
  if (!canvas || !historyRows.length) return;

  const labels = historyRows.map(r => FMT.mes(r.mes));

  _charts['chart-nmrr'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label:           `nMRR Real (${label})`,
          data:            historyRows.map(r => r.nmrr_real),
          backgroundColor: color + '99',
          borderColor:     color,
          borderWidth:     1,
          borderRadius:    4,
        },
        {
          type:            'line',
          label:           'Objetivo',
          data:            historyRows.map(r => r.nmrr_target),
          borderColor:     CONFIG.COLORS.target,
          borderDash:      [6, 3],
          borderWidth:     2,
          pointRadius:     0,
          fill:            false,
        },
      ],
    },
    options: {
      ...SHARED_OPTS,
      plugins: {
        ...SHARED_OPTS.plugins,
        title: { display: true, text: 'nMRR (USD) — Real vs Objetivo', font: { size: 14, weight: '600' } },
        tooltip: {
          ...SHARED_OPTS.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${Math.round(ctx.raw).toLocaleString('es-CL')}`,
          },
        },
      },
      scales: {
        ...SHARED_OPTS.scales,
        y: {
          ...SHARED_OPTS.scales.y,
          ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' },
        },
      },
    },
  });
}

// ── CPL grouped bar chart ─────────────────────────────────

function renderCPLChart(historyRows, label) {
  destroyChart('chart-cpl');
  const canvas = document.getElementById('chart-cpl');
  if (!canvas || !historyRows.length) return;

  const labels = historyRows.map(r => FMT.mes(r.mes));

  _charts['chart-cpl'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label:           'CPL Search Real',
          data:            historyRows.map(r => r.cpl_paid_search),
          backgroundColor: CONFIG.COLORS.dentalink + '99',
          borderColor:     CONFIG.COLORS.dentalink,
          borderWidth:     1,
          borderRadius:    4,
        },
        {
          label:           'Benchmark Search',
          data:            historyRows.map(r => r.cpl_benchmark_search),
          backgroundColor: CONFIG.COLORS.dentalink + '30',
          borderColor:     CONFIG.COLORS.dentalink,
          borderWidth:     1,
          borderDash:      [4, 2],
          borderRadius:    4,
        },
        {
          label:           'CPL Social Real',
          data:            historyRows.map(r => r.cpl_paid_social),
          backgroundColor: CONFIG.COLORS.medilink + '99',
          borderColor:     CONFIG.COLORS.medilink,
          borderWidth:     1,
          borderRadius:    4,
        },
        {
          label:           'Benchmark Social',
          data:            historyRows.map(r => r.cpl_benchmark_social),
          backgroundColor: CONFIG.COLORS.medilink + '30',
          borderColor:     CONFIG.COLORS.medilink,
          borderWidth:     1,
          borderDash:      [4, 2],
          borderRadius:    4,
        },
      ],
    },
    options: {
      ...SHARED_OPTS,
      plugins: {
        ...SHARED_OPTS.plugins,
        title: { display: true, text: 'CPL por Canal — Real vs Benchmark', font: { size: 14, weight: '600' } },
        tooltip: {
          ...SHARED_OPTS.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${Number(ctx.raw).toFixed(1)}`,
          },
        },
      },
      scales: {
        ...SHARED_OPTS.scales,
        y: {
          ...SHARED_OPTS.scales.y,
          ticks: { callback: v => '$' + v },
        },
      },
    },
  });
}

// ── CR bar + target line chart ─────────────────────────────

function renderCRChart(historyRows, label, color) {
  destroyChart('chart-cr');
  const canvas = document.getElementById('chart-cr');
  if (!canvas || !historyRows.length) return;

  const labels = historyRows.map(r => FMT.mes(r.mes));

  _charts['chart-cr'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label:           `CR MQL→Cal Real (${label})`,
          data:            historyRows.map(r => r.cr_mql_cal_real != null ? r.cr_mql_cal_real * 100 : null),
          backgroundColor: color + '99',
          borderColor:     color,
          borderWidth:     1,
          borderRadius:    4,
        },
        {
          type:            'line',
          label:           'Objetivo',
          data:            historyRows.map(r => r.cr_mql_cal_target != null ? r.cr_mql_cal_target * 100 : null),
          borderColor:     CONFIG.COLORS.target,
          borderDash:      [6, 3],
          borderWidth:     2,
          pointRadius:     0,
          fill:            false,
        },
      ],
    },
    options: {
      ...SHARED_OPTS,
      plugins: {
        ...SHARED_OPTS.plugins,
        title: { display: true, text: 'CR MQL → Calificado — Real vs Objetivo', font: { size: 14, weight: '600' } },
        tooltip: {
          ...SHARED_OPTS.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${Number(ctx.raw).toFixed(1)}%`,
          },
        },
      },
      scales: {
        ...SHARED_OPTS.scales,
        y: {
          ...SHARED_OPTS.scales.y,
          ticks: { callback: v => v + '%' },
        },
      },
    },
  });
}

// ── Render all historical charts ───────────────────────────

/**
 * @param {string} view - 'global' | 'focos'
 * @param {string} productoOrFoco - producto name for global, foco id for focos
 */
function renderAllCharts(view, productoOrFoco) {
  let history;
  let label;
  let color;

  if (view === 'focos') {
    history = getFocoHistory(productoOrFoco);
    const foco = CONFIG.FOCOS.find(f => f.id === productoOrFoco);
    label   = foco ? foco.label : productoOrFoco;
    color   = foco?.producto === 'Medilink' ? CONFIG.COLORS.medilink : CONFIG.COLORS.dentalink;
  } else {
    const producto = productoOrFoco || 'Total';
    history = getGlobalHistory(producto);
    label   = producto;
    color   = producto === 'Medilink' ? CONFIG.COLORS.medilink : CONFIG.COLORS.dentalink;
  }

  renderNMQLChart(history, label, color);
  renderNMQLCalChart(history, label, color);
  renderNMRRChart(history, label, color);
  renderCPLChart(history, label);
  renderCRChart(history, label, color);
}

// ── Helpers ────────────────────────────────────────────────

function destroyChart(id) {
  if (_charts[id]) {
    _charts[id].destroy();
    delete _charts[id];
  }
}
