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

        // Datos propios del test: un avión y un tripulante
        await page.click('[data-view="aviones"]');
        await page.fill('#avion-patente', TAG);
        await page.fill('#avion-modelo', 'Boeing 737 (test)');
        await page.selectOption('#avion-estado', 'disponible');
        await page.click('#form-avion button[type="submit"]');
        await expect(page.locator('#tabla-aviones-body')).toContainText(TAG);

        await page.click('[data-view="tripulantes"]');
        await page.fill('#tripulante-nombre', TAG);
        await page.selectOption('#tripulante-rol', 'piloto');
        await page.click('#form-tripulante button[type="submit"]');
        await expect(page.locator('#tabla-tripulantes-body')).toContainText(TAG);

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

        // Asignar tripulante
        await page.selectOption('#select-tripulante-nuevo', { label: `${TAG} (piloto)` });
        await page.click('#btn-asignar-tripulante');
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(TAG);

        await page.click('#btn-cerrar-detalle');

        // Cambiar el estado del vuelo desde el Panel de Estado
        await page.click('[data-view="panel"]');
        const proximo = page.locator('#panel-proximo');
        await expect(proximo).toContainText(TAG, { timeout: 10000 });
        await proximo.locator('.btn-iniciar').click();

        const tarjetaEnCurso = page.locator('#panel-en-curso .panel-card', { hasText: TAG });
        await expect(tarjetaEnCurso).toBeVisible({ timeout: 10000 });

        // quitar tripulación de un vuelo que ya está en_vuelo
        await page.click('[data-view="vuelos"]');
        await page.selectOption('#filtro-estado', '');
        await page.click('#btn-filtrar');
        const filaEnVuelo = page.locator('#tabla-vuelos-body tr', { hasText: TAG });
        await filaEnVuelo.locator('.btn-ver').click();

        let mensajeError = '';
        page.once('dialog', async dialog => {
            mensajeError = dialog.message();
            await dialog.accept();
        });
        await page.locator('#lista-tripulantes-asignados li button', { hasText: 'Quitar' }).click();
        await page.waitForTimeout(300);

        expect(mensajeError.length).toBeGreaterThan(0); // el backend rechazó la acción
        await expect(page.locator('#lista-tripulantes-asignados')).toContainText(TAG); // sigue ahí
    });
});