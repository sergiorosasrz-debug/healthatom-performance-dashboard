// ============================================================
// data.js — Google Sheets fetching, parsing, and normalization
// ============================================================

// In-memory cache so month/view switches don't re-fetch
let _cache = null;

// ── Public API ─────────────────────────────────────────────

/**
 * Loads data from Google Sheets (both tabs in parallel).
 * Uses in-memory cache after first load.
 * @returns {Promise<{global: Array, focos: Array, months: string[]}>}
 */
async function loadData(forceRefresh = false) {
  if (_cache && !forceRefresh) return _cache;

  const sheetId = CONFIG.SHEET_ID;
  if (!sheetId || sheetId === 'YOUR_SHEET_ID_HERE') {
    throw new Error('SHEET_ID no configurado. Edita js/config.js con el ID de tu Google Sheet.');
  }

  const [globalRaw, focosRaw] = await Promise.all([
    fetchTab(sheetId, CONFIG.GIDS.global),
    fetchTab(sheetId, CONFIG.GIDS.focos),
  ]);

  const globalData = normalizeRows(globalRaw);
  const focosData  = normalizeRows(focosRaw);

  // Collect all unique months across both tabs, sorted descending
  const allMonths = [...new Set([
    ...globalData.map(r => r.mes),
    ...focosData.map(r => r.mes),
  ])].filter(Boolean).sort().reverse();

  _cache = { global: globalData, focos: focosData, months: allMonths };
  return _cache;
}

/**
 * Returns rows for a specific month from global tab.
 * @param {string} mes - YYYY-MM
 * @returns {{ dentalink: Object|null, medilink: Object|null, total: Object|null }}
 */
function getGlobalForMonth(mes) {
  if (!_cache) return { dentalink: null, medilink: null, total: null };
  const rows = _cache.global.filter(r => r.mes === mes);
  return {
    dentalink: rows.find(r => r.producto === 'Dentalink') || null,
    medilink:  rows.find(r => r.producto === 'Medilink')  || null,
    total:     rows.find(r => r.producto === 'Total')     || null,
  };
}

/**
 * Returns rows for a specific month from focos tab.
 * @param {string} mes - YYYY-MM
 * @returns {Array<Object>} array of foco rows
 */
function getFocosForMonth(mes) {
  if (!_cache) return [];
  return _cache.focos.filter(r => r.mes === mes);
}

/**
 * Returns all global rows for a given producto, sorted by mes ascending (for charts).
 */
function getGlobalHistory(producto) {
  if (!_cache) return [];
  return _cache.global
    .filter(r => r.producto === producto)
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

/**
 * Returns all foco rows for a given foco id, sorted by mes ascending (for charts).
 */
function getFocoHistory(focoId) {
  if (!_cache) return [];
  return _cache.focos
    .filter(r => r.foco === focoId)
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

// ── Internal helpers ───────────────────────────────────────

/**
 * Fetches a Google Sheets tab via CSV export URL.
 * The CSV export endpoint includes Access-Control-Allow-Origin: * so fetch() works.
 */
async function fetchTab(sheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al cargar datos (HTTP ${res.status}). Verifica que la Sheet está compartida como "Cualquiera con el enlace".`);
  }
  const text = await res.text();
  return parseCSV(text);
}

/**
 * Parses CSV text into an array of plain objects keyed by the header row.
 */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] !== undefined ? values[i].trim() : null;
    });
    return obj;
  });
}

/**
 * Splits a single CSV line respecting quoted fields.
 */
function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function normalizeRows(rows) {
  return rows
    .map(row => {
      // Validate mes column (must be YYYY-MM string)
      const mes = String(row.mes || '').trim();
      if (!/^\d{4}-\d{2}$/.test(mes)) return null;

      return {
        mes,
        producto:               String(row.producto || '').trim() || null,
        foco:                   String(row.foco || '').trim() || null,
        nmql_real:              toNum(row.nmql_real),
        nmql_target:            toNum(row.nmql_target),
        nmql_cal_real:          toNum(row.nmql_cal_real),
        nmql_cal_target:        toNum(row.nmql_cal_target),
        nmrr_real:              toNum(row.nmrr_real),
        nmrr_target:            toNum(row.nmrr_target),
        cpl_paid_search:        toNum(row.cpl_paid_search),
        cpl_paid_social:        toNum(row.cpl_paid_social),
        cpl_benchmark_search:   toNum(row.cpl_benchmark_search),
        cpl_benchmark_social:   toNum(row.cpl_benchmark_social),
        cr_mql_cal_real:        toNum(row.cr_mql_cal_real),
        cr_mql_cal_target:      toNum(row.cr_mql_cal_target),
      };
    })
    .filter(Boolean);
}

function toNum(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
