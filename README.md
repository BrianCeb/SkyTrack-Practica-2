# SkyTrack Airlines ✈️

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

PORT=3000
JWT_SECRET=cambiar_esto
DB_STORAGE=./database.sqlite

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

- **Avion**: patente, modelo, estado (disponible / en_vuelo / mantenimiento)
- **Vuelo**: origen, destino, fecha, hora, estado (programado / embarcando / en_vuelo / aterrizado / cancelado)
- **Tripulante**: nombre y rol (piloto / copiloto / auxiliar)
- **AsignacionTripulacion**: la tabla intermedia entre Vuelo y Tripulante, porque es una relación de muchos a muchos
- **Usuario**: email, password hasheado y rol (admin / operador)


## que fui agregando

Estas las fui descubriendo probando la app a mano, no las tenía pensadas desde el principio:

- No dejo dar de baja un vuelo que está `en_vuelo`.
- No dejo asignar ni sacar tripulación de un vuelo si no está en estado `programado` o `embarcando` (por ejemplo, si ya está `en_vuelo` o `aterrizado`, no se toca la tripulación).
- Solo un `admin` puede dar de baja un vuelo. Para asignar/quitar tripulación alcanza con estar logueado como `admin` u `operador`.

## Endpoints

| Método | Ruta | Qué hace | Quién puede |
|---|---|---|---|
| POST | /api/auth/registrar | Crea un usuario | Cualquiera |
| POST | /api/auth/login | Login, devuelve el JWT | Cualquiera |
| GET | /api/aviones | Lista los aviones | Logueado |
| POST | /api/aviones | Crea un avión | Logueado |
| PUT | /api/aviones/:id | Edita un avión | Logueado |
| GET | /api/vuelos | Lista vuelos (con filtros de origen, destino, estado) | Logueado |
| POST | /api/vuelos | Crea un vuelo | Logueado |
| PUT | /api/vuelos/:id | Edita un vuelo | Logueado |
| DELETE | /api/vuelos/:id | Da de baja el vuelo (lógica) | Admin |
| GET | /api/vuelos/panel | Trae el próximo vuelo y los que están en curso | Logueado |
| PATCH | /api/vuelos/:id/iniciar | Pasa el vuelo a en_vuelo | Logueado |
| PATCH | /api/vuelos/:id/aterrizar | Pasa el vuelo a aterrizado | Logueado |
| POST | /api/vuelos/:id/tripulantes | Asigna un tripulante al vuelo | Admin / Operador |
| DELETE | /api/vuelos/:id/tripulantes/:idTripulante | Saca un tripulante del vuelo | Admin / Operador |
| GET | /api/tripulantes | Lista los tripulantes | Logueado |
| POST | /api/tripulantes | Crea un tripulante | Logueado |

## Tests

**Unitario (Jest):**
```bash
npm test
```
Prueba que el filtro de vuelos por estado y por origen funcione bien, y que un vuelo dado de baja no aparezca más en el listado. Corre contra una base SQLite en memoria, separada de la de desarrollo.

**End-to-end (Playwright):**
```bash
npm run test:e2e
```
Simula a un usuario real usando la app desde el navegador: entra, loguea, filtra vuelos, entra al detalle de uno, le asigna tripulación, cambia su estado desde el Panel, y por último verifica que no se pueda sacar tripulación de un vuelo que ya está en vuelo. Corre contra una base descartable (`database.e2e.sqlite`) que se recrea de cero en cada corrida, así nunca depende de los datos que tenga cargados en mi base de desarrollo.
