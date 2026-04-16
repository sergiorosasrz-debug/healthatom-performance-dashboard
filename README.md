# Performance Dashboard — HealthAtom

Dashboard de cumplimiento de KPIs del equipo de Growth & Performance.
Publicado en GitHub Pages, datos desde Google Sheets.

---

## Paso 1 — Crear la Google Sheet

Crea una nueva Google Sheet y agrégale **2 pestañas** con exactamente estos nombres:

### Pestaña 1: `KPIs_Globales_Producto`

| mes | producto | nmql_real | nmql_target | nmql_cal_real | nmql_cal_target | nmrr_real | nmrr_target | cpl_paid_search | cpl_paid_social | cpl_benchmark_search | cpl_benchmark_social | cr_mql_cal_real | cr_mql_cal_target |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-04 | Total | 450 | 500 | 90 | 100 | 25000 | 30000 | 27.5 | 18.2 | 25.0 | 17.0 | 0.20 | 0.22 |
| 2026-04 | Dentalink | 310 | 340 | 62 | 68 | 18000 | 21000 | 26.0 | 17.5 | 24.0 | 16.5 | 0.20 | 0.22 |
| 2026-04 | Medilink | 140 | 160 | 28 | 32 | 7000 | 9000 | 30.0 | 19.5 | 27.0 | 18.0 | 0.20 | 0.22 |

- Una fila por mes × producto (3 filas por mes: `Total`, `Dentalink`, `Medilink`)
- `mes`: formato YYYY-MM
- `cr_mql_cal_real` y `cr_mql_cal_target`: decimales (0.20 = 20%)
- CPL en USD. Si tienes CLP, dividir por 950. Si tienes COP, dividir por 4.100.

### Pestaña 2: `KPIs_Focos`

Mismas columnas pero reemplazando `producto` por `foco`:

| mes | foco | producto | nmql_real | nmql_target | ... |
|---|---|---|---|---|---|
| 2026-04 | DL CL | Dentalink | 85 | 100 | ... |
| 2026-04 | DL COL | Dentalink | 70 | 80 | ... |

Focos válidos: `DL CL`, `DL COL`, `DL MX`, `DL OT-AR`, `DL OT-EC`, `DL OT-RD`, `DL OT-ES`, `DL OT-RESTO`, `ML CL`, `ML COL`, `ML OT`

---

## Paso 2 — Publicar la Sheet

**⚠️ Este paso es obligatorio para que el dashboard pueda leer los datos.**

1. Archivo → Compartir → **Publicar en la web**
2. Seleccionar: "Todo el documento" + "Página web"
3. Click en **Publicar** → confirmar
4. Cerrar el modal (no necesitas copiar ningún link)

> Nota: "Publicar en la web" es distinto de "Compartir con personas". No hace la Sheet editable por nadie.

---

## Paso 3 — Configurar el Sheet ID

1. Abre la URL de tu Google Sheet. Se ve así:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
   ```
2. Copia la parte entre `/d/` y `/edit` → ese es tu **Sheet ID**

3. Abre el archivo `js/config.js` y reemplaza:
   ```js
   SHEET_ID: 'YOUR_SHEET_ID_HERE',
   ```
   por:
   ```js
   SHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
   ```

---

## Paso 4 — Probar localmente

Como el dashboard hace fetch a Google Sheets, no puedes abrir el HTML directo con doble-click. Usa un servidor local:

```bash
# Desde la carpeta performance-dashboard/
python3 -m http.server 8000
```

Luego abre: http://localhost:8000

---

## Paso 5 — Publicar en GitHub Pages

1. Crea un repositorio **público** en GitHub (ej: `healthatom-performance-dashboard`)

2. Sube los archivos:
   ```bash
   git init
   git add .
   git commit -m "Initial dashboard"
   git remote add origin https://github.com/TU_USUARIO/healthatom-performance-dashboard.git
   git push -u origin main
   ```

3. En GitHub → Settings → Pages → Source: **Deploy from branch** → `main` / `/ (root)`

4. Espera ~1 minuto y tu URL pública será:
   ```
   https://TU_USUARIO.github.io/healthatom-performance-dashboard/
   ```

5. Comparte esa URL con el equipo. ¡Listo!

---

## Actualizar datos cada mes

1. Abre la Google Sheet
2. Agrega las filas del nuevo mes (YYYY-MM) en ambas pestañas
3. El dashboard se actualiza automáticamente al refrescar la página
4. No necesitas tocar el código ni hacer deploy nuevamente

---

## Estructura de archivos

```
performance-dashboard/
├── index.html          ← página principal
├── css/
│   └── styles.css      ← estilos
├── js/
│   ├── config.js       ← ⚙️ EDITAR AQUÍ: Sheet ID, umbrales, colores
│   ├── data.js         ← lógica de fetch + normalización
│   ├── ui.js           ← renderizado de cards y tabla
│   ├── charts.js       ← gráficos Chart.js
│   └── app.js          ← controlador principal
└── README.md           ← este archivo
```

---

## Ajustar umbrales del semáforo

En `js/config.js`, sección `TRAFFIC_LIGHT`:

```js
TRAFFIC_LIGHT: {
  GREEN: 0.90,   // >= 90% del objetivo → verde
  AMBER: 0.75,   // >= 75% → amarillo; < 75% → rojo
},
```

Cambia los valores según los estándares del equipo.
