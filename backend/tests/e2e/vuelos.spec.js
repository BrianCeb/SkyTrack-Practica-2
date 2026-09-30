const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = 'admin@skytrack.com';
const ADMIN_PASSWORD = 'admin123';
const TAG = `E2E-${Date.now()}`;

test.describe('Flujo completo: login, vuelos, panel de estado y tripulación', () => {

    test.beforeAll(async ({ request }) => {
        const res = await request.post('/api/auth/registrar', {
            data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, rol: 'admin' },
        });
        if (!res.ok()) {
            const body = await res.text();
            throw new Error(`No se pudo crear el usuario admin para el test: ${res.status()} ${body}`);
        }
    });

    test('gestiona un vuelo de punta a punta', async ({ page }) => {
        // Entrar y loguearse
        await page.goto('/');
        await page.fill('#login-email', ADMIN_EMAIL);
        await page.fill('#login-password', ADMIN_PASSWORD);
        await page.click('#form-login button[type="submit"]');

        const errorLogin = page.locator('#login-error');
        if (await errorLogin.textContent()) {
            console.log('LOGIN ERROR:', await errorLogin.textContent());
        }
        await expect(page.locator('#app-view')).toBeVisible({ timeout: 8000 });

        // Datos propios del test: un avión y tres tripulantes (piloto, copiloto y auxiliar)
        await page.click('[data-view="aviones"]');
        await page.fill('#avion-patente', TAG);
        await page.fill('#avion-modelo', 'Boeing 737 (test)');
        await page.selectOption('#avion-estado', 'disponible');
        await page.click('#form-avion button[type="submit"]');
        await expect(page.locator('#tabla-aviones-body')).toContainText(TAG);

        await page.click('[data-view="tripulantes"]');

        const PILOTO = `${TAG}-piloto`;
        const COPILOTO = `${TAG}-copiloto`;
        const AUXILIAR = `${TAG}-auxiliar`;

        await page.fill('#tripulante-nombre', PILOTO);
        await page.selectOption('#tripulante-rol', 'piloto');
        await page.click('#form-tripulante button[type="submit"]');
        await expect(page.locator('#tabla-tripulantes-body')).toContainText(PILOTO);

        await page.fill('#tripulante-nombre', COPILOTO);
        await page.selectOption('#tripulante-rol', 'copiloto');
        await page.click('#form-tripulante button[type="submit"]');
        await expect(page.locator('#tabla-tripulantes-body')).toContainText(COPILOTO);

        await page.fill('#tripulante-nombre', AUXILIAR);
        await page.selectOption('#tripulante-rol', 'auxiliar');
        await page.click('#form-tripulante button[type="submit"]');
        await expect(page.locator('#tabla-tripulantes-body')).toContainText(AUXILIAR);

        // Ver listado de vuelos y crear uno nuevo
        await page.click('[data-view="vuelos"]');
        await page.click('#btn-nuevo-vuelo');
        await page.fill('#vuelo-origen', TAG);
        await page.fill('#vuelo-destino', 'Bariloche');
        await page.fill('#vuelo-fecha', '2030-01-01');
        await page.fill('#vuelo-hora', '10:00');
        await page.selectOption('#vuelo-avion', { label: `${TAG} (Boeing 737 (test))` });
        await page.selectOption('#vuelo-estado', 'programado');
        await page.click('#form-vuelo button[type="submit"]');
        await expect(page.locator('#tabla-vuelos-body')).toContainText(TAG);

        // Filtrar por estado
        await page.selectOption('#filtro-estado', 'programado');
        await page.click('#btn-filtrar');
        const fila = page.locator('#tabla-vuelos-body tr', { hasText: TAG });
        await expect(fila).toBeVisible();

        // Seleccionar el vuelo
        await fila.locator('.btn-ver').click();
        await expect(page.locator('#detalle-vuelo')).toBeVisible();
        await expect(page.locator('#detalle-vuelo-info')).toContainText(TAG);

        // Ver tripulación asignada
        await expect(page.locator('#lista-tripulantes-asignados li')).toHaveCount(0);

        // Asignar los 3 tripulantes (piloto, copiloto y auxiliar) requeridos para poder despegar
        await page.selectOption('#select-tripulante-nuevo', { label: `${PILOTO} (piloto)` });
        await page.click('#btn-asignar-tripulante');
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(PILOTO);

        await page.selectOption('#select-tripulante-nuevo', { label: `${COPILOTO} (copiloto)` });
        await page.click('#btn-asignar-tripulante');
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(COPILOTO);

        await page.selectOption('#select-tripulante-nuevo', { label: `${AUXILIAR} (auxiliar)` });
        await page.click('#btn-asignar-tripulante');
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(AUXILIAR);

        await page.click('#btn-cerrar-detalle');

        // Cambiar el estado del vuelo desde el Panel de Control
        await page.click('[data-view="panel"]');
        const tarjetaProgramada = page.locator('#panel-tab-programados .panel-card', { hasText: TAG });
        await expect(tarjetaProgramada).toBeVisible({ timeout: 10000 });
        await tarjetaProgramada.locator('.btn-iniciar').click();

        await page.click('.panel-tab-btn[data-tab="en-curso"]');
        const tarjetaEnCurso = page.locator('#panel-tab-en-curso .panel-card', { hasText: TAG });
        await expect(tarjetaEnCurso).toBeVisible({ timeout: 10000 });

        // Un vuelo en_vuelo no permite modificar la tripulación: la UI queda en modo solo lectura
        await page.click('[data-view="vuelos"]');
        await page.selectOption('#filtro-estado', '');
        await page.click('#btn-filtrar');
        const filaEnVuelo = page.locator('#tabla-vuelos-body tr', { hasText: TAG });
        await filaEnVuelo.locator('.btn-ver').click();

        // Esperamos a que el detalle termine de refrescarse con el estado actualizado
        await expect(page.locator('#detalle-vuelo-info')).toContainText('en_vuelo', { timeout: 10000 });

        // No debe existir ningún botón "Quitar" (no se puede tocar la tripulación de un vuelo en curso)
        await expect(page.locator('#lista-tripulantes-asignados li button', { hasText: 'Quitar' })).toHaveCount(0);

        // Debe verse el mensaje de tripulación cerrada
        await expect(page.locator('#mensaje-tripulacion-cerrada')).toBeVisible();

        // Los 3 tripulantes siguen en la lista, solo que ahora en modo lectura
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(PILOTO);
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(COPILOTO);
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(AUXILIAR);
    });
});