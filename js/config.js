// ============================================================
// config.js — Central configuration for Performance Dashboard
// Update SHEET_ID after publishing your Google Sheet
// ============================================================

const CONFIG = {
  // ── Google Sheets ─────────────────────────────────────────
  // Replace with your actual Sheet ID (from the URL: /spreadsheets/d/{SHEET_ID}/edit)
  SHEET_ID: '1FgRkjb4YuMNRs1ff3jwukpJsi4wlMdqGgrqxdxmD4OQ',
  TABS: {
    global: 'KPIs_Globales_Producto',
    focos:  'KPIs_Focos',
  },

  // Sheet tab GIDs — find them in the URL when clicking each tab
  // e.g. /edit?gid=0#gid=0  →  GID is "0"
  GIDS: {
    global: '0',
    focos:  '760951471',
  },

  // ── Strategic Focuses (Foco × 11) ─────────────────────────
  FOCOS: [
    // Dentalink
    { id: 'DL CL',       label: 'DL Chile',       producto: 'Dentalink' },
    { id: 'DL COL',      label: 'DL Colombia',     producto: 'Dentalink' },
    { id: 'DL MX',       label: 'DL México',       producto: 'Dentalink' },
    { id: 'DL OT-AR',    label: 'DL Argentina',    producto: 'Dentalink' },
    { id: 'DL OT-EC',    label: 'DL Ecuador',      producto: 'Dentalink' },
    { id: 'DL OT-RD',    label: 'DL Rep. Dom.',    producto: 'Dentalink' },
    { id: 'DL OT-ES',    label: 'DL España',       producto: 'Dentalink' },
    { id: 'DL OT-RESTO', label: 'DL Resto',        producto: 'Dentalink' },
    // Medilink
    { id: 'ML CL',       label: 'ML Chile',        producto: 'Medilink' },
    { id: 'ML COL',      label: 'ML Colombia',     producto: 'Medilink' },
    { id: 'ML OT',       label: 'ML Resto',        producto: 'Medilink' },
  ],

  PRODUCTOS: ['Dentalink', 'Medilink'],

  // ── Metric definitions ────────────────────────────────────
  METRICS: {
    nmql: {
      label: 'nMQL',
      description: 'New MQL',
      realKey: 'nmql_real',
      targetKey: 'nmql_target',
      higherIsBetter: true,
      format: 'int',
      icon: '🎯',
    },
    nmql_cal: {
      label: 'nMQL Cal.',
      description: 'nMQL Calificados',
      realKey: 'nmql_cal_real',
      targetKey: 'nmql_cal_target',
      higherIsBetter: true,
      format: 'int',
      icon: '✅',
    },
    nmrr: {
      label: 'nMRR',
      description: 'New MRR (USD)',
      realKey: 'nmrr_real',
      targetKey: 'nmrr_target',
      higherIsBetter: true,
      format: 'usd',
      icon: '💰',
    },
    cpl_search: {
      label: 'CPL Search',
      description: 'Costo por Lead — Paid Search',
      realKey: 'cpl_paid_search',
      targetKey: 'cpl_benchmark_search',
      higherIsBetter: false,
      format: 'usd_decimal',
      icon: '🔍',
    },
    cpl_social: {
      label: 'CPL Social',
      description: 'Costo por Lead — Paid Social',
      realKey: 'cpl_paid_social',
      targetKey: 'cpl_benchmark_social',
      higherIsBetter: false,
      format: 'usd_decimal',
      icon: '📱',
    },
    cr: {
      label: 'CR MQL→Cal.',
      description: 'Conversión MQL → Calificado',
      realKey: 'cr_mql_cal_real',
      targetKey: 'cr_mql_cal_target',
      higherIsBetter: true,
      format: 'pct',
      icon: '📈',
    },
  },

  // ── Traffic light thresholds ──────────────────────────────
  // For higherIsBetter metrics: ratio = real / target
  // For cost metrics: ratio is inverted before applying thresholds
  TRAFFIC_LIGHT: {
    GREEN:  0.90,   // >= 90% of target → green
    AMBER:  0.75,   // >= 75% → amber, < 75% → red
  },

  // ── Color palette ─────────────────────────────────────────
  COLORS: {
    dentalink:      '#0ea5e9',   // sky-500
    medilink:       '#8b5cf6',   // violet-500
    target:         '#94a3b8',   // slate-400
    targetDashed:   '#cbd5e1',   // slate-300
    green:          '#16a34a',
    amber:          '#d97706',
    red:            '#dc2626',
    greenBg:        '#dcfce7',
    amberBg:        '#fef3c7',
    redBg:          '#fee2e2',
    gridLine:       '#e2e8f0',
    textMuted:      '#64748b',
    // Chart fill (semi-transparent)
    dentalinkAlpha: 'rgba(14, 165, 233, 0.15)',
    medilinkAlpha:  'rgba(139, 92, 246, 0.15)',
  },

  // ── Sparkline config (last N months shown in cards) ───────
  SPARKLINE_MONTHS: 6,
};

// ── Formatting helpers ─────────────────────────────────────
const FMT = {
  int: v => v == null ? '—' : Math.round(v).toLocaleString('es-CL'),
  usd: v => v == null ? '—' : '$' + Math.round(v).toLocaleString('es-CL'),
  usd_decimal: v => v == null ? '—' : '$' + Number(v).toFixed(1),
  pct: v => v == null ? '—' : (v * 100).toFixed(1) + '%',
  mes: s => {
    if (!s) return '';
    const [y, m] = s.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  },
};

// ── Traffic light logic ────────────────────────────────────
function getTrafficLight(real, target, higherIsBetter) {
  if (real == null || target == null || target === 0) return null;
  const ratio = real / target;
  const effective = higherIsBetter ? ratio : (2 - ratio);
  if (effective >= CONFIG.TRAFFIC_LIGHT.GREEN) return 'green';
  if (effective >= CONFIG.TRAFFIC_LIGHT.AMBER) return 'amber';
  return 'red';
}

function getPct(real, target) {
  if (real == null || target == null || target === 0) return null;
  return (real / target) * 100;
}
