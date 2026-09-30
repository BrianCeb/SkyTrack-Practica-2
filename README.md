# SkyTrack Airlines 
Este es mi proyecto final de la Práctica Profesionalizante II (Tecnicatura Superior en Desarrollo de Software). Es un sistema de gestión de vuelos, aviones y tripulación para una aerolínea ficticia.

## Con qué lo hice

- **Backend:** Node.js + Express
- **ORM:** Sequelize
- **Base de datos:** SQLite. La elegí porque es un solo archivo, no necesito instalar ni configurar nada en otra compu
- **Autenticación:** JWT + bcrypt para las contraseñas
- **Frontend:** HTML, CSS y JS puro, sin frameworks. Lo serví desde el mismo Express del backend
- **Testing:** un test unitario con Jest y un test end-to-end con Playwright

## Cómo lo levanto

```bash
gh repo clone BrianCeb/SkyTrack-Practica-2
cd backend
npm install
```

Necesito un archivo `.env` adentro de `backend/` con esto:

```
PORT=3000
JWT_SECRET=cambiar_esto
DB_STORAGE=./database.sqlite
```

```bash
npm run seed     # para cargar las tablas con datos de prueba
npm run dev
```

Y para correrlo:

```bash
npm start        # lo levanta normal
npm run dev      # con nodemon, para ir probando cambios
```

Queda andando en `http://localhost:3000`, frontend y API juntos.

## Usuarios para probar

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@skytrack.com | admin123 |
| Operador | operador@skytrack.com | oper123 |

Si hace falta crear otro, es un POST a `/api/auth/registrar`.

## Cómo armé el modelo de datos

- **Avion**: patente, modelo, estado (disponible / en_vuelo / mantenimiento). No tiene baja lógica — a diferencia del vuelo, que es un evento que hay que auditar, el avión es un recurso que se reutiliza indefinidamente.
- **Vuelo**: origen, destino, fecha, hora, estado (programado / embarcando / en_vuelo / aterrizado / cancelado), `activo` (baja lógica).
- **Tripulante**: nombre y rol (piloto / copiloto / auxiliar)
- **AsignacionTripulacion**: la tabla intermedia entre Vuelo y Tripulante, porque es una relación de muchos a muchos
- **Usuario**: email, password hasheado y rol (admin / operador)

Relaciones: `Avion 1---N Vuelo` (un vuelo tiene un solo avión, un avión tiene muchos vuelos a lo largo del tiempo) y `Vuelo N---N Tripulante` a través de `AsignacionTripulacion`.

## Reglas de negocio que fui agregando

Estas las fui descubriendo probando la app a mano, no las tenía pensadas desde el principio:

- No se puede dar de baja un vuelo que está `en_vuelo` o ya `aterrizado` (queda como historial).
- Un vuelo solo se puede **editar** mientras está `programado` (ni siquiera en `embarcando`).
- No se puede asignar ni sacar tripulación de un vuelo si no está en estado `programado` o `embarcando`.
- No se puede asignar un avión que no está `disponible` (en `mantenimiento` o `en_vuelo`) a un vuelo nuevo o editado.
- Un tripulante no puede estar asignado a dos vuelos al mismo tiempo, salvo que el otro vuelo ya esté `aterrizado` o `cancelado`.
- Para iniciar un vuelo (pasar a `en_vuelo`) tiene que tener asignado al menos 1 piloto, 1 copiloto y 1 auxiliar.
- Los estados `en_vuelo` y `aterrizado` **no se pueden setear a mano** desde el formulario de edición — solo se alcanzan desde los botones del Panel de Control ("Iniciar vuelo" / "Aterrizar"), que además actualizan el estado del avión asociado.
- Solo un `admin` puede dar de baja un vuelo. Para asignar/quitar tripulación alcanza con estar logueado como `admin` u `operador`.

## Endpoints

| Método | Ruta | Qué hace | Quién puede |
|---|---|---|---|
| POST | /api/auth/registrar | Crea un usuario | Cualquiera |
| POST | /api/auth/login | Login, devuelve el JWT | Cualquiera |
| GET | /api/aviones | Lista los aviones | Logueado |
| POST | /api/aviones | Crea un avión | Logueado |
| PUT | /api/aviones/:id | Edita un avión | Logueado |
| GET | /api/vuelos | Lista vuelos (con filtros de origen, destino, estado) | Cualquiera* |
| GET | /api/vuelos/:id | Detalle de un vuelo | Cualquiera* |
| POST | /api/vuelos | Crea un vuelo | Cualquiera* |
| PUT | /api/vuelos/:id | Edita un vuelo | Cualquiera* |
| DELETE | /api/vuelos/:id | Da de baja el vuelo (lógica) | Admin |
| GET | /api/vuelos/panel | Trae los vuelos agrupados por estado para el Panel de Control (programados, embarcando, en curso, aterrizados) | Cualquiera* |
| PATCH | /api/vuelos/:id/iniciar | Pasa el vuelo a en_vuelo (valida tripulación mínima) | Logueado |
| PATCH | /api/vuelos/:id/aterrizar | Pasa el vuelo a aterrizado | Logueado |
| POST | /api/vuelos/:id/tripulantes | Asigna un tripulante al vuelo | Admin / Operador |
| DELETE | /api/vuelos/:id/tripulantes/:idTripulante | Saca un tripulante del vuelo | Admin / Operador |
| GET | /api/tripulantes | Lista los tripulantes | Logueado |
| POST | /api/tripulantes | Crea un tripulante | Logueado |

\* Estas rutas todavía no tienen el middleware `verificarToken` aplicado — quedó pendiente agregarlo. Hoy cualquiera con acceso a la API (sin loguearse) puede listar, crear y editar vuelos. Es una mejora de seguridad pendiente, no una decisión de diseño.

## Tests

**Unitario (Jest):**
```bash
npm test
```
Corre `backend/tests/vuelosServices.test.js` contra una base SQLite **en memoria**, separada de la de desarrollo. Prueba: filtro de vuelos por estado, filtro por origen, y que un vuelo dado de baja no aparezca más en el listado.

**End-to-end (Playwright):**
```bash
npm run test:e2e
```
Simula a un usuario real usando la app desde el navegador: se loguea, crea un avión y tripulación completa (piloto, copiloto, auxiliar), crea un vuelo, lo filtra, le asigna la tripulación, lo inicia desde el Panel de Control, y verifica que una vez `en_vuelo` la interfaz ya no permita tocar la tripulación (modo solo lectura). Corre contra una base descartable (`database.e2e.sqlite`) que se recrea de cero en cada corrida, así nunca depende de los datos que tenga cargados en mi base de desarrollo.