/**
 * Cliente API REST (Consumo de json.pe en Node.js).
 * Equivalente a la lógica de peticiones HTTP de Buzzheavier.
 */
const cryptoStore = require('./crypto');
const db = require('./db');

const BASE_URL = 'https://api.json.pe';

async function hacerPeticion(endpoint, payload, token) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Error HTTP ${res.status}`);
    return data;
}

async function consultarTodo(placa, dni) {
    const token = cryptoStore.getToken();
    if (!token) throw new Error("Token no configurado. Por favor guarda tu token de json.pe.");

    placa = placa ? placa.toUpperCase().trim() : "";
    dni = dni ? dni.trim() : "";

    if (!placa && !dni) throw new Error("Debes ingresar placa o DNI.");

    const result = { errors: {} };

    // Ejecutamos las peticiones en paralelo (como en el proyecto Go)
    const promesas = [];

    if (placa) {
        promesas.push(
            hacerPeticion('/api/placa', { placa }, token)
                .then(data => result.placa = JSON.stringify(data))
                .catch(err => result.errors.placa = err.message)
        );
        promesas.push(
            hacerPeticion('/api/soat', { placa }, token)
                .then(data => result.soat = JSON.stringify(data))
                .catch(err => result.errors.soat = err.message)
        );
    }

    if (dni) {
        promesas.push(
            hacerPeticion('/api/licencia', { dni }, token)
                .then(data => result.licencia = JSON.stringify(data))
                .catch(err => result.errors.licencia = err.message)
        );
    }

    await Promise.all(promesas);

    if (Object.keys(result.errors).length === 0) {
        delete result.errors;
    }

    // Guardar en base de datos local SQLite si fue exitoso
    if (result.placa || result.soat || result.licencia) {
        db.guardarHistorial(placa, dni, result);
    }

    return result;
}

module.exports = { consultarTodo };
