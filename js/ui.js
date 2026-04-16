// ============================================================
// ui.js — DOM rendering: KPI cards, breakdown table, badges
// ============================================================

// ── Badge ──────────────────────────────────────────────────

function renderBadge(real, target, higherIsBetter) {
  const light = getTrafficLight(real, target, higherIsBetter);
  const pct   = getPct(real, target);
  if (light === null) return '<span class="badge badge--empty">—</span>';

  const labels = { green: 'On track', amber: 'At risk', red: 'Off track' };
  const pctStr = pct != null ? `${pct.toFixed(0)}%` : '';

  return `<span class="badge badge--${light}" title="${pctStr} del objetivo">
    ${labels[light]}
    ${pct != null ? `<span class="badge__pct">${pctStr}</span>` : ''}
  </span>`;
}

// ── KPI Summary Cards ──────────────────────────────────────

/**
 * Renders the 6 KPI summary cards for the global view.
 * @param {Object} totalRow - the "Total" row for selected month
 * @param {string} mes - YYYY-MM
 */
function renderKPICards(totalRow, mes) {
  const container = document.getElementById('kpi-cards');
  if (!container) return;

  const metrics = Object.entries(CONFIG.METRICS);

  container.innerHTML = metrics.map(([key, m]) => {
    const real   = totalRow ? totalRow[m.realKey]   : null;
    const target = totalRow ? totalRow[m.targetKey] : null;
    const pct    = getPct(real, target);
    const light  = getTrafficLight(real, target, m.higherIsBetter);

    const pctDisplay = pct != null
      ? `<span class="kpi-card__pct kpi-card__pct--${light ?? 'empty'}">${pct.toFixed(0)}% del objetivo</span>`
      : `<span class="kpi-card__pct kpi-card__pct--empty">Sin datos</span>`;

    return `
      <div class="kpi-card kpi-card--${light ?? 'empty'}">
        <div class="kpi-card__header">
          <span class="kpi-card__icon">${m.icon}</span>
          <span class="kpi-card__label">${m.label}</span>
          ${renderBadge(real, target, m.higherIsBetter)}
        </div>
        <div class="kpi-card__value">${FMT[m.format](real)}</div>
        <div class="kpi-card__meta">
          <span class="kpi-card__target">Objetivo: ${FMT[m.format](target)}</span>
          ${pctDisplay}
        </div>
        <div class="kpi-card__sparkline">
          <canvas id="sparkline-${key}" height="40"></canvas>
        </div>
      </div>
    `;
  }).join('');
}

// ── Breakdown Table (Global / Producto view) ───────────────

function renderGlobalTable(globalData, mes) {
  const table = document.getElementById('breakdown-table');
  if (!table) return;

  const metricEntries = Object.entries(CONFIG.METRICS);

  const headerCells = metricEntries.map(([, m]) =>
    `<th class="tbl__th" title="${m.description}">${m.label}</th>`
  ).join('');

  const rows = [
    { label: 'Dentalink', data: globalData.dentalink, cls: 'tbl__row--dentalink' },
    { label: 'Medilink',  data: globalData.medilink,  cls: 'tbl__row--medilink' },
    { label: 'Total',     data: globalData.total,     cls: 'tbl__row--total' },
  ];

  const bodyRows = rows.map(({ label, data, cls }) => {
    const cells = metricEntries.map(([, m]) => {
      const real   = data ? data[m.realKey]   : null;
      const target = data ? data[m.targetKey] : null;
      const light  = getTrafficLight(real, target, m.higherIsBetter);
      return `
        <td class="tbl__td tbl__td--${light ?? 'empty'}">
          <span class="tbl__real">${FMT[m.format](real)}</span>
          <span class="tbl__target">/ ${FMT[m.format](target)}</span>
          ${renderBadge(real, target, m.higherIsBetter)}
        </td>`;
    }).join('');
    return `<tr class="tbl__row ${cls}"><td class="tbl__td tbl__td--label">${label}</td>${cells}</tr>`;
  }).join('');

  table.innerHTML = `
    <thead>
      <tr>
        <th class="tbl__th tbl__th--label">Segmento</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  `;
}

// ── Breakdown Table (Focos × 11 view) ─────────────────────

function renderFocosTable(focosRows, mes) {
  const table = document.getElementById('breakdown-table');
  if (!table) return;

  const metricEntries = Object.entries(CONFIG.METRICS);

  const headerCells = metricEntries.map(([, m]) =>
    `<th class="tbl__th" title="${m.description}">${m.label}</th>`
  ).join('');

  // Group focos by product
  const grouped = {
    Dentalink: CONFIG.FOCOS.filter(f => f.producto === 'Dentalink'),
    Medilink:  CONFIG.FOCOS.filter(f => f.producto === 'Medilink'),
  };

  let bodyHtml = '';

  for (const [producto, focos] of Object.entries(grouped)) {
    // Product group header row
    bodyHtml += `
      <tr class="tbl__group-header">
        <td colspan="${metricEntries.length + 1}" class="tbl__group-label tbl__group-label--${producto.toLowerCase()}">${producto}</td>
      </tr>`;

    for (const foco of focos) {
      const row = focosRows.find(r => r.foco === foco.id) || null;
      const cells = metricEntries.map(([, m]) => {
        const real   = row ? row[m.realKey]   : null;
        const target = row ? row[m.targetKey] : null;
        const light  = getTrafficLight(real, target, m.higherIsBetter);
        return `
          <td class="tbl__td tbl__td--${light ?? 'empty'}">
            <span class="tbl__real">${FMT[m.format](real)}</span>
            <span class="tbl__target">/ ${FMT[m.format](target)}</span>
            ${renderBadge(real, target, m.higherIsBetter)}
          </td>`;
      }).join('');

      bodyHtml += `
        <tr class="tbl__row tbl__row--foco">
          <td class="tbl__td tbl__td--label">${foco.label}</td>
          ${cells}
        </tr>`;
    }
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th class="tbl__th tbl__th--label">Foco</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${bodyHtml}</tbody>
  `;
}

// ── Month selector ─────────────────────────────────────────

function populateMonthSelector(months) {
  const sel = document.getElementById('month-select');
  if (!sel) return;
  sel.innerHTML = months.map(m =>
    `<option value="${m}">${FMT.mes(m)}</option>`
  ).join('');
}

// ── Foco selector (visible only in focos chart view) ───────

function populateFocoSelector() {
  const sel = document.getElementById('foco-select');
  if (!sel) return;
  sel.innerHTML = CONFIG.FOCOS.map(f =>
    `<option value="${f.id}">${f.label}</option>`
  ).join('');
}

// ── Error / loading states ─────────────────────────────────

function showLoading() {
  document.getElementById('loading-overlay')?.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay')?.classList.add('hidden');
}

function showError(msg) {
  const el = document.getElementById('error-banner');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-banner')?.classList.add('hidden');
}

// ── Last-updated timestamp ─────────────────────────────────

function setLastUpdated(months) {
  const el = document.getElementById('last-updated');
  if (!el || !months.length) return;
  const latest = months[0]; // already sorted descending
  el.textContent = `Último dato: ${FMT.mes(latest)}`;
}
