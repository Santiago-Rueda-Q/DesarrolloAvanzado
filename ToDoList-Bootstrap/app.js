// === Config ===
const API = 'https://todoapitest.juansegaliz.com/todos';

// === Helpers ===
const $ = s => document.querySelector(s);
const parseResponse = async (res) => {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { data: null, raw: txt }; }
};
const pad = n => String(n).padStart(2,'0');
const toISO = (localValue) => {
  if (!localValue) return null;
  const [d,t] = localValue.split('T');
  const [Y,M,D] = d.split('-').map(Number);
  const [h,m]   = t.split(':').map(Number);
  return new Date(Y, M-1, D, h, m).toISOString();
};
const toLocalInputValue = (d)=>{
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const esc = (s='') => s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

const fmtDate = iso => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
};

const priorityLabel = p => ['Baja','Media','Alta'][p ?? 0];
const priorityBadgeClass = p => {
  const v = Number(p ?? 0);
  return ['text-bg-success','text-bg-warning','text-bg-danger'][v] || 'text-bg-secondary';
};

// === Estado ===
let todos = [];

// === CRUD ===
async function getAll(){
  const cont = $('#list');
  cont.innerHTML = `
    <div class="list-group-item d-flex align-items-center gap-2">
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      <span>Cargando…</span>
    </div>`;
  try{
    const res  = await fetch(API, { headers:{ Accept:'text/plain' }});
    const data = await parseResponse(res);
    if(!res.ok || !Array.isArray(data?.data)) throw new Error('Listado inválido');
    todos = data.data;
    render();
  }catch(e){
    cont.innerHTML = `
      <div class="list-group-item text-danger">Error al cargar la lista.</div>
    `;
    $('#count').textContent = '';
  }
}

async function getOne(id){
  const res  = await fetch(`${API}/${id}`, { headers:{ Accept:'text/plain' }});
  const data = await parseResponse(res);
  if(!res.ok || !data?.data) throw new Error('No encontrado');
  return data.data;
}

async function createTodo(payload){
  const res  = await fetch(API, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Accept:'text/plain' },
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(res);
  if(!res.ok || !data?.data) throw new Error('Error al crear');
  return data.data;
}

async function updateTodo(id, payload){
  const res  = await fetch(`${API}/${id}`, {
    method:'PUT',
    headers:{ 'Content-Type':'application/json', Accept:'text/plain' },
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(res);
  if(!res.ok || !data?.data) throw new Error('Error al actualizar');
  return data.data;
}

async function deleteTodo(id){
  const res  = await fetch(`${API}/${id}`, {
    method:'DELETE',
    headers:{ Accept:'text/plain' }
  });
  if(!res.ok) throw new Error('Error al eliminar');
  return true;
}

// === Render ===
function render(){
  const cont = $('#list');
  cont.classList.add('list-group','shadow-sm');

  if(!todos.length){
    cont.innerHTML = `
      <div class="list-group-item text-muted text-center py-3">Sin tareas.</div>
    `;
    $('#count').textContent = '0 tareas';
    return;
  }

  cont.innerHTML = todos.map(t => {
    const badgeCls = priorityBadgeClass(t.priority);
    return `
      <div class="list-group-item d-grid gap-3 align-items-center" data-id="${t.id}"
        style="grid-template-columns: 60px 1fr auto;">
        <!-- ID -->
        <div class="fw-bold text-secondary text-center id-tag">#${t.id}</div>

        <!-- Contenido -->
        <div class="min-w-0">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <strong class="text-break">${esc(t.title || '')}</strong>
            <span class="badge ${badgeCls}">
              ${priorityLabel(t.priority)}
            </span>
          </div>
          ${t.description ? `<div class="small text-muted desc mt-1 text-break">${esc(t.description)}</div>` : ''}
          <div class="small text-muted mt-1">
            Vence: ${fmtDate(t.dueAt)}
          </div>
        </div>

        <!-- Acciones -->
        <div class="d-flex align-items-center justify-content-end gap-2 actions">
          <button class="btn btn-sm btn-outline-primary btn-edit">Editar</button>
          <button class="btn btn-sm btn-outline-danger btn-del">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  $('#count').textContent = `${todos.length} ${todos.length===1?'tarea':'tareas'}`;

  if (window.matchMedia('(max-width: 760px)').matches) {
    cont.querySelectorAll('.list-group-item').forEach(item=>{
      item.style.gridTemplateColumns = '50px 1fr';
      const actions = item.querySelector('.actions');
      if (actions) actions.style.gridColumn = '2 / 3';
    });
  }
}

// === Eventos ===
$('#form-create').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const payload = {
    title:       $('#title').value.trim(),
    description: $('#description').value.trim(),
    priority:    Number($('#priority').value),
    dueAt:       toISO($('#dueAt').value)
  };
  if(!payload.title){ alert('El título es obligatorio'); return; }

  try{
    const created = await createTodo(payload);
    todos.unshift(created);
    e.target.reset();
    const next = new Date(); next.setMinutes(next.getMinutes()+60);
    $('#dueAt').value = toLocalInputValue(next);
    render();
  }catch{
    alert('No se pudo crear.');
  }
});

$('#btn-refresh').addEventListener('click', getAll);

$('#btn-get-one').addEventListener('click', async ()=>{
  const id = Number($('#byId').value);
  if(!id){ alert('Ingrese un ID válido'); return; }
  const out = $('#one-result');
  out.textContent = 'Consultando…';
  try{
    const data = await getOne(id);
    out.textContent = JSON.stringify(data, null, 2);
  }catch{
    out.textContent = 'No encontrado o error en la consulta.';
  }
});

$('#btn-clear-one').addEventListener('click', ()=>{
  $('#byId').value = '';
  $('#one-result').textContent = '';
});

$('#list').addEventListener('click', async (e)=>{
  const item = e.target.closest('.list-group-item');
  if(!item) return;
  const id = Number(item.dataset.id);
  const t  = todos.find(x => x.id === id);
  if(!t) return;

  if(e.target.classList.contains('btn-del')){
    if(!confirm('¿Eliminar?')) return;
    try{
      await deleteTodo(id);
      todos = todos.filter(x => x.id !== id);
      render();
    }catch{
      alert('No se pudo eliminar.');
    }
  }

  if(e.target.classList.contains('btn-edit')){
    const title = prompt('Título:', t.title ?? '')?.trim();
    if(!title) return;
    const description = prompt('Descripción:', t.description ?? '') ?? '';
    try{
      const updated = await updateTodo(id, {
        title,
        description,
        isCompleted: t.isCompleted ?? false,
        priority: t.priority ?? 0,
        dueAt: t.dueAt ?? null
      });
      Object.assign(t, updated);
      render();
    }catch{
      alert('No se pudo actualizar.');
    }
  }
});

// === Init ===
window.addEventListener('DOMContentLoaded', ()=>{
  const next = new Date(); next.setMinutes(next.getMinutes()+60);
  $('#dueAt').value = toLocalInputValue(next);
  getAll();
});
