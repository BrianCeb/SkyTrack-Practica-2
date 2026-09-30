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

// ---- Flatpickr (fecha y hora del vuelo) ----

const flatpickrFecha = flatpickr('#vuelo-fecha', {
    dateFormat: 'Y-m-d',
    allowInput: true,
    locale: 'es',
});

const flatpickrHora = flatpickr('#vuelo-hora', {
    enableTime: true,
    noCalendar: true,
    dateFormat: 'H:i',
    time_24hr: true,
    allowInput: true,
});

// ---- Helpers de UI (iconos y badges) ----

function iconoRol(rol) {
    const mapa = { piloto: 'fa-user-tie', copiloto: 'fa-user-check', auxiliar: 'fa-user' };
    return mapa[rol] || 'fa-user';
}

function badgeEstadoVuelo(estado) {
    const mapa = {
        programado: { icono: 'fa-clock', clase: 'badge-programado' },
        embarcando: { icono: 'fa-door-open', clase: 'badge-embarcando' },
        en_vuelo: { icono: 'fa-plane', clase: 'badge-en-vuelo' },
        aterrizado: { icono: 'fa-circle-check', clase: 'badge-aterrizado' },
        cancelado: { icono: 'fa-circle-xmark', clase: 'badge-cancelado' },
    };
    const { icono, clase } = mapa[estado] || { icono: 'fa-circle-question', clase: '' };
    return `<span class="badge ${clase}"><i class="fa-solid ${icono}"></i> ${estado}</span>`;
}

function badgeEstadoAvion(estado) {
    const mapa = {
        disponible: { icono: 'fa-circle-check', clase: 'badge-aterrizado' },
        en_vuelo: { icono: 'fa-plane', clase: 'badge-en-vuelo' },
        mantenimiento: { icono: 'fa-screwdriver-wrench', clase: 'badge-embarcando' },
    };
    const { icono, clase } = mapa[estado] || { icono: 'fa-circle-question', clase: '' };
    return `<span class="badge ${clase}"><i class="fa-solid ${icono}"></i> ${estado}</span>`;
}

// ---- Autenticacion ----

function mostrarApp() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    document.getElementById('usuario-info').textContent = usuario.email;

    // El tab de Usuarios solo se ve si sos admin
    const btnUsuarios = document.querySelector('.nav-btn[data-view="usuarios"]');
    if (usuario.rol === 'admin') {
        btnUsuarios.classList.remove('hidden');
    } else {
        btnUsuarios.classList.add('hidden');
    }
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

document.getElementById('btn-brand').addEventListener('click', () => {
    document.querySelector('.nav-btn[data-view="vuelos"]').click();
});

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
        const puedeEditar = v.estado === 'programado';
        const puedeDarBaja = usuario.rol === 'admin' && v.estado !== 'en_vuelo' && v.estado !== 'aterrizado';
        tr.innerHTML = `
      <td>${v.origen}</td><td>${v.destino}</td><td>${v.fecha}</td><td>${v.hora}</td><td>${badgeEstadoVuelo(v.estado)}</td>
      <td>${v.Avion ? v.Avion.patente : '-'}</td>
      <td>
        <button class="btn-ver" data-id="${v.id}"><i class="fa-solid fa-eye"></i> Ver</button>
        ${puedeEditar ? `<button class="btn-editar-vuelo" data-id="${v.id}"><i class="fa-solid fa-pen"></i> Editar</button>` : ''}
        ${puedeDarBaja ? `<button class="btn-baja" data-id="${v.id}"><i class="fa-solid fa-trash"></i> Dar de baja</button>` : ''}
      </td>`;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-ver').forEach(b => b.addEventListener('click', () => verDetalleVuelo(b.dataset.id)));
    tbody.querySelectorAll('.btn-editar-vuelo').forEach(b => b.addEventListener('click', () => abrirEdicionVuelo(b.dataset.id)));
    tbody.querySelectorAll('.btn-baja').forEach(b => b.addEventListener('click', () => darDeBajaVuelo(b.dataset.id)));
}

document.getElementById('btn-filtrar').addEventListener('click', cargarVuelos);

document.getElementById('btn-nuevo-vuelo').addEventListener('click', () => {
    document.getElementById('form-vuelo-titulo').textContent = 'Nuevo vuelo';
    document.getElementById('vuelo-id').value = '';
    document.getElementById('vuelo-origen').value = '';
    document.getElementById('vuelo-destino').value = '';
    flatpickrFecha.clear();
    flatpickrFecha.set('minDate', 'today'); // no deja elegir una fecha pasada al crear
    flatpickrHora.clear();
    document.getElementById('vuelo-estado').value = 'programado';
    llenarSelectAviones('vuelo-avion');
    document.getElementById('form-vuelo').classList.remove('hidden');
    document.getElementById('detalle-vuelo').classList.add('hidden');
});

async function abrirEdicionVuelo(id) {
    const vuelo = await api(`/vuelos/${id}`);
    document.getElementById('form-vuelo-titulo').textContent = 'Editar vuelo';
    document.getElementById('vuelo-id').value = vuelo.id;
    document.getElementById('vuelo-origen').value = vuelo.origen;
    document.getElementById('vuelo-destino').value = vuelo.destino;
    llenarSelectAviones('vuelo-avion');
    document.getElementById('vuelo-avion').value = vuelo.id_avion;
    document.getElementById('vuelo-estado').value = vuelo.estado;
    flatpickrFecha.set('minDate', null); // al editar permitimos conservar una fecha ya pasada
    flatpickrFecha.setDate(vuelo.fecha, true);
    flatpickrHora.setDate(vuelo.hora, true);
    document.getElementById('form-vuelo').classList.remove('hidden');
    document.getElementById('detalle-vuelo').classList.add('hidden');
}

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

    // Chequeo rápido en el cliente — solo aplica al crear, no al editar
    if (!id) {
        const fechaHora = new Date(`${datos.fecha}T${datos.hora}`);
        if (fechaHora < new Date()) {
            alert('No se puede programar un vuelo en una fecha u hora que ya pasó.');
            return;
        }
    }

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
    <p>${vuelo.fecha} ${vuelo.hora} &mdash; ${badgeEstadoVuelo(vuelo.estado)}</p>
    <p>Avion: ${vuelo.Avion ? `${vuelo.Avion.patente} (${vuelo.Avion.modelo})` : '-'}</p>`;

    const puedeEditarTripulacion = vuelo.estado === 'programado' || vuelo.estado === 'embarcando';

    const lista = document.getElementById('lista-tripulantes-asignados');
    lista.innerHTML = '';
    (vuelo.Tripulantes || []).forEach(t => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.innerHTML = `<i class="fa-solid ${iconoRol(t.rol)}"></i> ${t.nombre} (${t.rol})`;
        li.appendChild(span);
        if (puedeEditarTripulacion) {
            const btnQuitar = document.createElement('button');
            btnQuitar.innerHTML = '<i class="fa-solid fa-user-minus"></i> Quitar';
            btnQuitar.addEventListener('click', async () => {
                try {
                    await api(`/vuelos/${id}/tripulantes/${t.id}`, { method: 'DELETE' });
                    verDetalleVuelo(id);
                } catch (err) {
                    alert(err.message);
                }
            });
            li.appendChild(btnQuitar);
        }
        lista.appendChild(li);
    });

    const asignarDiv = document.querySelector('.asignar-tripulante');
    const mensajeCerrado = document.getElementById('mensaje-tripulacion-cerrada');

    if (!puedeEditarTripulacion) {
        asignarDiv.classList.add('hidden');
        mensajeCerrado.classList.remove('hidden');
        return;
    }

    asignarDiv.classList.remove('hidden');
    mensajeCerrado.classList.add('hidden');

    // Un tripulante ocupado en otro vuelo que todavía no aterrizó/canceló no puede aparecer como opción
    const asignadosIds = (vuelo.Tripulantes || []).map(t => t.id);
    const todosLosVuelos = await api('/vuelos');
    const ocupadosEnOtroVuelo = new Set();
    todosLosVuelos.forEach(v => {
        if (v.id == id) return;
        if (v.estado === 'aterrizado' || v.estado === 'cancelado') return;
        (v.Tripulantes || []).forEach(t => ocupadosEnOtroVuelo.add(t.id));
    });

    const select = document.getElementById('select-tripulante-nuevo');
    select.innerHTML = '';
    cacheTripulantes
        .filter(t => !asignadosIds.includes(t.id) && !ocupadosEnOtroVuelo.has(t.id))
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

// ---- Panel de Control (Caso Nº 6) ----

async function cargarPanel() {
    const data = await api('/vuelos/panel');
    renderTarjetasPanel('panel-tab-programados', data.programados, 'iniciar', 'No hay vuelos programados.');
    renderTarjetasPanel('panel-tab-embarcando', data.embarcando, 'iniciar', 'No hay vuelos embarcando.');
    renderTarjetasPanel('panel-tab-en-curso', data.enCurso, 'aterrizar', 'No hay vuelos en curso.');
    renderTarjetasPanel('panel-tab-historial', data.aterrizados, null, 'Todavía no aterrizó ningún vuelo.');
}

function renderTarjetasPanel(contenedorId, vuelos, accion, mensajeVacio) {
    const contenedor = document.getElementById(contenedorId);
    contenedor.innerHTML = '';

    if (!vuelos.length) {
        contenedor.innerHTML = `<p>${mensajeVacio}</p>`;
        return;
    }

    vuelos.forEach(v => {
        const div = document.createElement('div');
        div.className = 'panel-card';
        let boton = '';
        if (accion === 'iniciar') {
            boton = `<button class="btn-iniciar" data-id="${v.id}"><i class="fa-solid fa-plane-departure"></i> Iniciar vuelo</button>`;
        } else if (accion === 'aterrizar') {
            boton = `<button class="btn-aterrizar" data-id="${v.id}"><i class="fa-solid fa-plane-arrival"></i> Aterrizar</button>`;
        }
        div.innerHTML = `<p><i class="fa-solid fa-plane"></i> ${v.origen} &rarr; ${v.destino} &mdash; ${v.fecha} ${v.hora}</p>${boton}`;
        contenedor.appendChild(div);
    });

    contenedor.querySelectorAll('.btn-iniciar').forEach(b =>
        b.addEventListener('click', async () => {
            try {
                await api(`/vuelos/${b.dataset.id}/iniciar`, { method: 'PATCH' });
                cargarPanel();
            } catch (err) {
                alert(err.message);
            }
        })
    );
    contenedor.querySelectorAll('.btn-aterrizar').forEach(b =>
        b.addEventListener('click', async () => {
            try {
                await api(`/vuelos/${b.dataset.id}/aterrizar`, { method: 'PATCH' });
                cargarPanel();
            } catch (err) {
                alert(err.message);
            }
        })
    );
}

document.querySelectorAll('.panel-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.panel-tab-contenido').forEach(c => c.classList.add('hidden'));
        document.getElementById(`panel-tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
});
// ---- Aviones ----

async function cargarAviones() {
    cacheAviones = await api('/aviones');
    const tbody = document.getElementById('tabla-aviones-body');
    tbody.innerHTML = '';
    cacheAviones.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.patente}</td><td>${a.modelo}</td><td>${badgeEstadoAvion(a.estado)}</td>
      <td><button class="btn-editar-avion" data-id="${a.id}"><i class="fa-solid fa-pen"></i> Editar</button></td>`;
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
        tr.innerHTML = `<td><i class="fa-solid ${iconoRol(t.rol)}"></i> ${t.nombre}</td><td>${t.rol}</td>`;
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

// ---- Usuarios (solo admin) ----

document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
        email: document.getElementById('usuario-email').value,
        password: document.getElementById('usuario-password').value,
        rol: document.getElementById('usuario-rol').value,
    };
    const mensaje = document.getElementById('usuario-mensaje');
    try {
        await api('/auth/registrar', { method: 'POST', body: JSON.stringify(datos) });
        mensaje.textContent = `Usuario ${datos.email} creado correctamente.`;
        mensaje.className = 'mensaje-exito';
        e.target.reset();
    } catch (err) {
        mensaje.textContent = err.message;
        mensaje.className = 'error';
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