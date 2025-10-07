const API = 'https://todoapitest.juansegaliz.com/todos';

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

// UI
const prioText = p => ['Baja','Media','Alta'][p ?? 0];
const prioBadge = (p) => {
  const base = "px-2 py-0.5 rounded-md text-xs font-semibold";
  if (p === 2) return `${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
  if (p === 1) return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
  return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`;
};

// === Estado ===
let todos = [];

// === CRUD ===
async function getAll(){
  $('#list').textContent = 'Cargando…';
  const res  = await fetch(API, { headers:{ Accept:'text/plain' }});
  const data = await parseResponse(res);
  if(!res.ok || !Array.isArray(data?.data)) throw new Error('Listado inválido');
  todos = data.data;
  render();
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
  if(!todos.length){
    cont.innerHTML = '<div class="p-4 text-center text-muted">Sin tareas.</div>';
    $('#count').textContent = '0 tareas';
    return;
  }

  cont.innerHTML = todos.map(t => `
    <article class="grid grid-cols-[64px_1fr_auto] gap-4 items-center p-4 hover:bg-white/40 transition dark:hover:bg-zinc-700/40" data-id="${t.id}">
      <!-- ID -->
      <div class="text-center">
        <div class="text-sm text-muted font-semibold">ID</div>
        <div class="text-xl font-extrabold text-muted">#${t.id}</div>
      </div>

      <!-- Main -->
      <div class="min-w-0">
        <div class="flex items-center gap-3 flex-wrap">
          <strong class="text-lg truncate">${esc(t.title || '')}</strong>
          <span class="${prioBadge(t.priority)}">${prioText(t.priority)}</span>
          <span class="text-xs text-muted">Vence: ${t.dueAt ? new Date(t.dueAt).toLocaleString() : '—'}</span>
        </div>
        ${t.description ? `<p class="mt-1 text-sm text-muted break-words">${esc(t.description)}</p>` : ''}
      </div>

      <!-- Actions -->
      <div class="flex gap-2 justify-end">
        <button data-action="edit"
                class="px-3 py-2 rounded-md border border-border bg-transparent text-text font-semibold hover:bg-border hover:text-white transition dark:border-zinc-600">
          Editar
        </button>
        <button data-action="del"
                class="px-3 py-2 rounded-md bg-danger text-white font-semibold hover:opacity-90 transition">
          Eliminar
        </button>
      </div>
    </article>
  `).join('');

  $('#count').textContent = `${todos.length} ${todos.length===1?'tarea':'tareas'}`;
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
  }catch{ alert('No se pudo crear.'); }
});

$('#btn-refresh').addEventListener('click', getAll);
$('#btn-clear-form').addEventListener('click', ()=> {
  $('#title').value = '';
  $('#description').value = '';
  $('#priority').value = '0';
  const next = new Date(); next.setMinutes(next.getMinutes()+60);
  $('#dueAt').value = toLocalInputValue(next);
});

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

// Delegación de acciones
$('#list').addEventListener('click', async (e)=>{
  const actionBtn = e.target.closest('[data-action]');
  const item = e.target.closest('[data-id]');
  if(!actionBtn || !item) return;

  const id = Number(item.dataset.id);
  const t  = todos.find(x => x.id === id);
  if(!t) return;

  const action = actionBtn.dataset.action;

  if(action === 'del'){
    if(!confirm('¿Eliminar?')) return;
    try{
      await deleteTodo(id);
      todos = todos.filter(x => x.id !== id);
      render();
    }catch{ alert('No se pudo eliminar.'); }
  }

  if(action === 'edit'){
    const title = prompt('Título:', t.title ?? '')?.trim();
    if(!title) return;
    const description = prompt('Descripción:', t.description ?? '') ?? '';
    try{
      const updated = await updateTodo(id, {
        title, description,
        isCompleted: t.isCompleted ?? false,
        priority: t.priority ?? 0,
        dueAt: t.dueAt ?? null
      });
      Object.assign(t, updated);
      render();
    }catch{ alert('No se pudo actualizar.'); }
  }
});

// === Init ===
window.addEventListener('DOMContentLoaded', ()=>{
  const next = new Date(); next.setMinutes(next.getMinutes()+60);
  $('#dueAt').value = toLocalInputValue(next);
  getAll();
});
