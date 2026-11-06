const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const tokenStatus = $('token-status');
const resultBody = $('result-body');
const resultBadge = $('result-badge');
const resultMessage = $('result-message');
const copyBtn = $('copy-btn');
const toggleBtn = $('toggle-raw');

let lastRaw = null;
let showingRaw = false;

// ---------- helpers ----------
function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + type;
}

function escapeHTML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function prettyJSON(raw) {
  try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
}

function showToast(msg, type = '') {
  const container = $('toast-container');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, 2000);
}

function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 450);
}

function staggerChildren(parent, step = 20, cap = 300) {
  Array.from(parent.children).forEach((el, i) => {
    el.style.animationDelay = Math.min(i * step, cap) + 'ms';
  });
}

const KNOWN_LABELS = {
  placa: 'Placa', marca: 'Marca', modelo: 'Modelo', color: 'Color', anio: 'Año', año: 'Año',
  serie: 'Serie', motor: 'Motor', vin: 'VIN', tipo: 'Tipo', categoria: 'Categoría', uso: 'Uso',
  asientos: 'Asientos', peso: 'Peso', ejes: 'Ejes', carroceria: 'Carrocería', combustible: 'Combustible',
  cilindros: 'Cilindros', potencia: 'Potencia', estado: 'Estado', propietario: 'Propietario',
  dni: 'DNI', ruc: 'RUC', nombres: 'Nombres', apellidos: 'Apellidos', nombre: 'Nombre',
  razon_social: 'Razón Social', direccion: 'Dirección', departamento: 'Departamento',
  provincia: 'Provincia', distrito: 'Distrito', soat: 'SOAT', compania: 'Compañía',
  aseguradora: 'Aseguradora', poliza: 'Póliza', certificado: 'Certificado', vigencia: 'Vigencia',
  inicio: 'Inicio', fin: 'Fin', fecha: 'Fecha', fecha_inicio: 'Fecha Inicio', fecha_fin: 'Fecha Fin',
  fecha_expedicion: 'Fecha Expedición', fecha_vencimiento: 'Fecha Vencimiento', clase: 'Clase',
  puntos: 'Puntos', licencia: 'Licencia', restricciones: 'Restricciones', observaciones: 'Observaciones'
};

function prettifyKey(key) {
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  return String(key).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'number') return v.toLocaleString('es-PE');
  if (typeof v === 'string') {
    if (v.trim() === '') return '—';
    return v;
  }
  return String(v);
}

function renderLoading() {
  resultBody.innerHTML = Array.from({ length: 5 }, () => '<div class="skeleton-row"></div>').join('');
}

function renderResult(raw) {
  lastRaw = raw; showingRaw = false; toggleBtn.textContent = 'Ver JSON';
  toggleBtn.disabled = false; copyBtn.disabled = false;

  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    resultBadge.className = 'badge badge-error'; resultBadge.textContent = 'ERROR';
    resultMessage.textContent = 'La respuesta no es JSON válido'; resultMessage.className = 'result-message error';
    resultBody.innerHTML = `<pre class="output">${escapeHTML(raw)}</pre>`;
    staggerChildren(resultBody); shake(resultBadge); return;
  }

  const hasSuccess = typeof parsed.success === 'boolean';
  const isSuccess = !hasSuccess || parsed.success === true;
  const message = parsed.message || parsed.error || '';

  if (isSuccess) { resultBadge.className = 'badge badge-ok'; resultBadge.textContent = 'OK'; }
  else { resultBadge.className = 'badge badge-error'; resultBadge.textContent = 'ERROR'; shake(resultBadge); }
  
  resultMessage.textContent = message || (isSuccess ? 'Consulta completada' : '');
  resultMessage.className = 'result-message' + (isSuccess ? '' : ' error');

  const data = parsed.data !== undefined ? parsed.data : parsed;
  const dataIsEmpty = data === null || data === undefined || (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0);

  if (dataIsEmpty) {
    resultBody.innerHTML = `<p class="muted">${escapeHTML(message || 'Sin datos')}</p>`;
    staggerChildren(resultBody); return;
  }

  resultBody.innerHTML = renderNode(data, 0);
  staggerChildren(resultBody);
}

function renderNode(node, depth) {
  if (node === null || node === undefined) return `<p class="muted">Sin datos</p>`;
  if (typeof node !== 'object') return `<div class="kv-row"><span class="kv-key">Valor</span><span class="kv-value">${escapeHTML(formatValue(node))}</span></div>`;
  
  if (Array.isArray(node)) {
    if (node.length === 0) return `<p class="muted">Lista vacía</p>`;
    return node.map((item, i) => {
      const label = (item && (item.nombre || item.placa || item.dni)) || `Ítem ${i + 1}`;
      return `<div class="section">${escapeHTML(label)}</div>` + renderNode(item, depth + 1);
    }).join('');
  }

  const entries = Object.entries(node);
  if (entries.length === 0) return `<p class="muted">Objeto vacío</p>`;

  return entries.map(([k, v]) => {
    const isNested = v !== null && typeof v === 'object';
    if (isNested) return `<div class="section">${escapeHTML(prettifyKey(k))}</div>` + renderNode(v, depth + 1);
    const val = formatValue(v); const empty = val === '—';
    return `<div class="kv-row"><span class="kv-key">${escapeHTML(prettifyKey(k))}</span><span class="kv-value ${empty ? 'empty' : ''}">${escapeHTML(val)}</span></div>`;
  }).join('');
}

// ---------- Token Logic ----------
$('save-token').onclick = async () => {
  const t = $('token').value.trim();
  if (!t) return showToast('token vacío', 'error');
  
  await window.desktopAPI.saveToken(t);
  tokenStatus.textContent = 'configurado ✓ (Cifrado)';
  tokenStatus.style.color = '#4ade80';
  showToast('Token guardado de forma segura', 'success');
  $('token').value = '';
};

async function checkToken() {
  const has = await window.desktopAPI.hasToken();
  if (has) {
    tokenStatus.textContent = 'configurado ✓ (Cifrado)';
    tokenStatus.style.color = '#4ade80';
  } else {
    tokenStatus.textContent = 'no configurado';
    tokenStatus.style.color = '#ff6b6b';
  }
}

// ---------- Tabs ----------
const tabResults = { placa: { raw: null, error: null }, soat: { raw: null, error: null }, licencia: { raw: null, error: null } };
let activeTab = 'placa';

function setTabDot(name, status) {
  const dot = document.querySelector(`.tab-dot[data-for="${name}"]`);
  if (dot) dot.className = 'tab-dot' + (status === 'idle' ? '' : ' status-' + status);
}

function renderActiveTab() {
  const resultView = $('result-view'), histView = $('hist-view'), searchBar = $('search-bar');
  
  if (activeTab === 'historial') {
    resultView.style.display = 'none'; histView.style.display = 'block'; searchBar.style.display = 'none';
    loadHistorial(); return;
  }

  resultView.style.display = 'block'; histView.style.display = 'none'; searchBar.style.display = 'flex';
  const entry = tabResults[activeTab];

  if (entry.raw) renderResult(entry.raw);
  else if (entry.error) {
    lastRaw = null; resultBadge.className = 'badge badge-error'; resultBadge.textContent = 'ERROR';
    resultMessage.textContent = entry.error; resultMessage.className = 'result-message error';
    resultBody.innerHTML = `<p class="muted">Error al consultar ${activeTab}</p>`;
  } else {
    lastRaw = null; resultBadge.className = 'badge badge-neutral'; resultBadge.textContent = 'Sin consulta';
    resultMessage.textContent = ''; resultBody.innerHTML = `<p class="muted">Consultá para ver resultados de ${activeTab}.</p>`;
  }
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active'); activeTab = tab.dataset.tab; renderActiveTab();
  };
});

// ---------- Consultar ----------
async function consultarTodo() {
  const placa = $('placa-input').value.trim(), dni = $('dni-input').value.trim();
  if (!placa && !dni) return showToast('ingresá placa o DNI', 'error');

  setStatus('consultando...'); renderLoading();
  ['placa', 'soat', 'licencia'].forEach(t => setTabDot(t, 'pending'));

  try {
    const r = await window.desktopAPI.consultarTodo(placa, dni);
    
    const assign = (name, rawVal, errVal) => {
      if (rawVal) { tabResults[name] = { raw: rawVal, error: null }; setTabDot(name, 'ok'); }
      else if (errVal) { tabResults[name] = { raw: null, error: errVal }; setTabDot(name, 'error'); }
      else { tabResults[name] = { raw: null, error: null }; setTabDot(name, 'empty'); }
    };

    const errs = r.errors || {};
    if (placa) { assign('placa', r.placa, errs.placa); assign('soat', r.soat, errs.soat); }
    else { tabResults.placa = { raw: null, error: null }; tabResults.soat = { raw: null, error: null }; setTabDot('placa', 'idle'); setTabDot('soat', 'idle'); }
    
    if (dni) { assign('licencia', r.licencia, errs.licencia); }
    else { tabResults.licencia = { raw: null, error: null }; setTabDot('licencia', 'idle'); }

    const okCount = ['placa', 'soat', 'licencia'].filter(t => tabResults[t].raw).length;
    if (okCount > 0) { setStatus(`${okCount} resultado(s) obtenido(s)`, 'ok'); showToast('Consulta exitosa y guardada en SQLite', 'success'); }
    else { setStatus('error', 'error'); showToast('Error en las consultas', 'error'); }

    renderActiveTab();
  } catch (e) {
    setStatus('error', 'error'); showToast(String(e), 'error');
    ['placa', 'soat', 'licencia'].forEach(t => setTabDot(t, 'error'));
    renderActiveTab();
  }
}

$('search-all-btn').onclick = consultarTodo;
['placa-input', 'dni-input'].forEach(id => $(id).addEventListener('keypress', e => { if (e.key === 'Enter') consultarTodo(); }));

// ---------- Historial ----------
async function loadHistorial() {
  const list = $('hist-list');
  list.innerHTML = '<p class="muted">cargando...</p>';
  try {
    const items = await window.desktopAPI.getHistorial();
    if (!items || items.length === 0) { list.innerHTML = '<p class="muted">sin consultas aún</p>'; return; }
    
    list.innerHTML = '';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'hist-item';
      div.innerHTML = `<span class="svc">${escapeHTML(item.placa || item.dni)}</span><span>${escapeHTML(item.fecha)}</span><span class="muted">Ver</span>`;
      div.onclick = () => renderResult(JSON.stringify(item.resultado));
      list.appendChild(div);
    });
    staggerChildren(list, 18, 250);
  } catch (e) { list.innerHTML = '<p class="muted">error: ' + escapeHTML(e) + '</p>'; }
}

$('refresh-hist').onclick = loadHistorial;

// ---------- Acciones ----------
copyBtn.onclick = async () => {
  if (!lastRaw) return;
  await navigator.clipboard.writeText(prettyJSON(lastRaw));
  copyBtn.textContent = 'Copiado ✓';
  setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 1200);
};

toggleBtn.onclick = () => {
  if (!lastRaw) return;
  showingRaw = !showingRaw;
  if (showingRaw) {
    toggleBtn.textContent = 'Vista bonita';
    resultBody.innerHTML = `<pre class="output">${escapeHTML(prettyJSON(lastRaw))}</pre>`;
  } else {
    renderResult(lastRaw);
  }
  staggerChildren(resultBody);
};

renderActiveTab();
checkToken();
