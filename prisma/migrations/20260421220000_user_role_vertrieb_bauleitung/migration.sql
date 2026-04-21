-- API-Rolle umbenannt: VERTRIEB → VERTRIEB_BAULEITUNG (fachlich „Vertrieb / Bauleitung“).
UPDATE users SET role = 'VERTRIEB_BAULEITUNG' WHERE role = 'VERTRIEB';

