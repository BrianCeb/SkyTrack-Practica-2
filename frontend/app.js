const API = '/api';
let token = localStorage.getItem('token') || null;
let usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
let vueloSeleccionadoId = null;
let cacheAviones = [];
let cacheTripulantes = [];

function headers(conContentType) {
    const h = {};
    if (conContentType) h['Content-Type'] = 'application/json';
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: { ...headers(!!options.body), ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.detalle) || (data && data.error) || 'Error de red');
    return data;
}

// ---- Autenticacion ----

function mostrarApp() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    document.getElementById('usuario-info').textContent = `${usuario.email} (${usuario.rol})`;
}

function mostrarLogin() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('app-view').classList.add('hidden');
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        token = data.token;
        usuario = data.usuario;
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        document.getElementById('login-error').textContent = '';
        mostrarApp();
        await cargarTodo();
    } catch (err) {
        document.getElementById('login-error').textContent = err.message;
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    token = null;
    usuario = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    mostrarLogin();
});

// ---- Navegacion ----

let intervaloPanel = null;

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`view-${btn.dataset.view}`).classList.remove('hidden');

        clearInterval(intervaloPanel); // frenamos el auto-refresh si veníamos del panel

        if (btn.dataset.view === 'panel') {
            cargarPanel();
            intervaloPanel = setInterval(cargarPanel, 4000); // se refresca solo cada 4 segundos
        }
        if (btn.dataset.view === 'vuelos') {
            cargarVuelos(); // siempre trae el estado más actualizado al volver a esta pestaña
        }
    });
});
// ---- Vuelos ----

async function cargarVuelos() {
    const origen = document.getElementById('filtro-origen').value.trim();
    const destino = document.getElementById('filtro-destino').value.trim();
    const estado = document.getElementById('filtro-estado').value;
    const params = new URLSearchParams();
    if (origen) params.set('origen', origen);
    if (destino) params.set('destino', destino);
    if (estado) params.set('estado', estado);

    const vuelos = await api(`/vuelos?${params.toString()}`);
    const tbody = document.getElementById('tabla-vuelos-body');
    tbody.innerHTML = '';
    vuelos.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${v.origen}</td><td>${v.destino}</td><td>${v.fecha}</td><td>${v.hora}</td><td>${v.estado}</td>
      <td>${v.Avion ? v.Avion.patente : '-'}</td>
      <td>
        <button class="btn-ver" data-id="${v.id}">Ver</button>
        ${usuario.rol === 'admin' ? `<button class="btn-baja" data-id="${v.id}">Dar de baja</button>` : ''}
      </td>`;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-ver').forEach(b => b.addEventListener('click', () => verDetalleVuelo(b.dataset.id)));
    tbody.querySelectorAll('.btn-baja').forEach(b => b.addEventListener('click', () => darDeBajaVuelo(b.dataset.id)));
}

document.getElementById('btn-filtrar').addEventListener('click', cargarVuelos);

document.getElementById('btn-nuevo-vuelo').addEventListener('click', () => {
    document.getElementById('form-vuelo-titulo').textContent = 'Nuevo vuelo';
    document.getElementById('vuelo-id').value = '';
    document.getElementById('vuelo-origen').value = '';
    document.getElementById('vuelo-destino').value = '';
    document.getElementById('vuelo-fecha').value = '';
    document.getElementById('vuelo-hora').value = '';
    document.getElementById('vuelo-estado').value = 'programado';
    llenarSelectAviones('vuelo-avion');
    document.getElementById('form-vuelo').classList.remove('hidden');
    document.getElementById('detalle-vuelo').classList.add('hidden');
});

document.getElementById('btn-cancelar-vuelo').addEventListener('click', () => {
    document.getElementById('form-vuelo').classList.add('hidden');
});

document.getElementById('form-vuelo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('vuelo-id').value;
    const datos = {
        origen: document.getElementById('vuelo-origen').value,
        destino: document.getElementById('vuelo-destino').value,
        fecha: document.getElementById('vuelo-fecha').value,
        hora: document.getElementById('vuelo-hora').value,
        id_avion: Number(document.getElementById('vuelo-avion').value),
        estado: document.getElementById('vuelo-estado').value,
    };
    try {
        if (id) await api(`/vuelos/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
        else await api('/vuelos', { method: 'POST', body: JSON.stringify(datos) });
        document.getElementById('form-vuelo').classList.add('hidden');
        await cargarVuelos();
    } catch (err) {
        alert(err.message);
    }
});

async function darDeBajaVuelo(id) {
    if (!confirm('¿Dar de baja este vuelo?')) return;
    try {
        await api(`/vuelos/${id}`, { method: 'DELETE' });
        if (vueloSeleccionadoId == id) {
            document.getElementById('detalle-vuelo').classList.add('hidden');
            vueloSeleccionadoId = null;
        }
        await cargarVuelos();
    } catch (err) {
        alert(err.message);
    }
}
async function verDetalleVuelo(id) {
    vueloSeleccionadoId = id;
    const vuelo = await api(`/vuelos/${id}`);
    document.getElementById('form-vuelo').classList.add('hidden');
    document.getElementById('detalle-vuelo').classList.remove('hidden');
    document.getElementById('detalle-vuelo-info').innerHTML = `
    <p><strong>${vuelo.origen} &rarr; ${vuelo.destino}</strong></p>
    <p>${vuelo.fecha} ${vuelo.hora} &mdash; Estado: ${vuelo.estado}</p>
    <p>Avion: ${vuelo.Avion ? `${vuelo.Avion.patente} (${vuelo.Avion.modelo})` : '-'}</p>`;

    const lista = document.getElementById('lista-tripulantes-asignados');
    lista.innerHTML = '';
    (vuelo.Tripulantes || []).forEach(t => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `${t.nombre} (${t.rol})`;
        const btnQuitar = document.createElement('button');
        btnQuitar.textContent = 'Quitar';
        btnQuitar.addEventListener('click', async () => {
            try {
                await api(`/vuelos/${id}/tripulantes/${t.id}`, { method: 'DELETE' });
                verDetalleVuelo(id);
            } catch (err) {
                alert(err.message);
            }
        });
        li.appendChild(span);
        li.appendChild(btnQuitar);
        lista.appendChild(li);
    });

    const asignadosIds = (vuelo.Tripulantes || []).map(t => t.id);
    const select = document.getElementById('select-tripulante-nuevo');
    select.innerHTML = '';
    cacheTripulantes
        .filter(t => !asignadosIds.includes(t.id))
        .forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${t.nombre} (${t.rol})`;
            select.appendChild(opt);
        });
}

document.getElementById('btn-asignar-tripulante').addEventListener('click', async () => {
    const idTripulante = document.getElementById('select-tripulante-nuevo').value;
    if (!idTripulante || !vueloSeleccionadoId) return;
    try {
        await api(`/vuelos/${vueloSeleccionadoId}/tripulantes`, {
            method: 'POST',
            body: JSON.stringify({ id_tripulante: Number(idTripulante) }),
        });
        verDetalleVuelo(vueloSeleccionadoId);
    } catch (err) {
        alert(err.message);
    }
});

document.getElementById('btn-cerrar-detalle').addEventListener('click', () => {
    document.getElementById('detalle-vuelo').classList.add('hidden');
    vueloSeleccionadoId = null;
});

// ---- Panel de estado (Caso Nº 6) ----

async function cargarPanel() {
    const data = await api('/vuelos/panel');
    const proximoDiv = document.getElementById('panel-proximo');
    proximoDiv.innerHTML = data.proximo
        ? `<h3>Próximo vuelo a despegar</h3><p>${data.proximo.origen} &rarr; ${data.proximo.destino} &mdash; ${data.proximo.fecha} ${data.proximo.hora}</p>
       <button class="btn-iniciar" data-id="${data.proximo.id}">Iniciar vuelo</button>`
        : `<p>No hay vuelos programados.</p>`;

    const enCursoDiv = document.getElementById('panel-en-curso');
    enCursoDiv.innerHTML = '';
    data.enCurso.forEach(v => {
        const div = document.createElement('div');
        div.className = 'panel-card';
        div.innerHTML = `<p>${v.origen} &rarr; ${v.destino} &mdash; ${v.fecha} ${v.hora}</p>
      <button class="btn-aterrizar" data-id="${v.id}">Aterrizar</button>`;
        enCursoDiv.appendChild(div);
    });

    document.querySelectorAll('.btn-iniciar').forEach(b =>
        b.addEventListener('click', async () => { await api(`/vuelos/${b.dataset.id}/iniciar`, { method: 'PATCH' }); cargarPanel(); })
    );
    document.querySelectorAll('.btn-aterrizar').forEach(b =>
        b.addEventListener('click', async () => { await api(`/vuelos/${b.dataset.id}/aterrizar`, { method: 'PATCH' }); cargarPanel(); })
    );
}

// ---- Aviones ----

async function cargarAviones() {
    cacheAviones = await api('/aviones');
    const tbody = document.getElementById('tabla-aviones-body');
    tbody.innerHTML = '';
    cacheAviones.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.patente}</td><td>${a.modelo}</td><td>${a.estado}</td>
      <td><button class="btn-editar-avion" data-id="${a.id}">Editar</button></td>`;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-editar-avion').forEach(b =>
        b.addEventListener('click', () => {
            const avion = cacheAviones.find(a => a.id == b.dataset.id);
            document.getElementById('avion-id').value = avion.id;
            document.getElementById('avion-patente').value = avion.patente;
            document.getElementById('avion-modelo').value = avion.modelo;
            document.getElementById('avion-estado').value = avion.estado;
        })
    );
}

function llenarSelectAviones(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    cacheAviones.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.patente} (${a.modelo})`;
        select.appendChild(opt);
    });
}

document.getElementById('form-avion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('avion-id').value;
    const datos = {
        patente: document.getElementById('avion-patente').value,
        modelo: document.getElementById('avion-modelo').value,
        estado: document.getElementById('avion-estado').value,
    };
    try {
        if (id) await api(`/aviones/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
        else await api('/aviones', { method: 'POST', body: JSON.stringify(datos) });
        e.target.reset();
        document.getElementById('avion-id').value = '';
        await cargarAviones();
    } catch (err) {
        alert(err.message);
    }
});

// ---- Tripulantes ----

async function cargarTripulantes() {
    cacheTripulantes = await api('/tripulantes');
    const tbody = document.getElementById('tabla-tripulantes-body');
    tbody.innerHTML = '';
    cacheTripulantes.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${t.nombre}</td><td>${t.rol}</td>`;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-tripulante').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
        nombre: document.getElementById('tripulante-nombre').value,
        rol: document.getElementById('tripulante-rol').value,
    };
    try {
        await api('/tripulantes', { method: 'POST', body: JSON.stringify(datos) });
        e.target.reset();
        await cargarTripulantes();
    } catch (err) {
        alert(err.message);
    }
});

// ---- Carga inicial ----

async function cargarTodo() {
    await cargarAviones();
    await cargarTripulantes();
    await cargarVuelos();
}

if (token && usuario) {
    mostrarApp();
    cargarTodo();
} else {
    mostrarLogin();
}

