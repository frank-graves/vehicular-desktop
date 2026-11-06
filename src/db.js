/**
 * Base de datos local SQLite.
 * Guarda el historial de consultas de forma persistente sin dependencias nativas.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const os = require('os');
const fs = require('fs');

const DB_DIR = path.join(os.homedir(), '.vehicular');
const DB_PATH = path.join(DB_DIR, 'vehicular.sqlite');

let db = null; // Instancia de SQL.js Database

async function init() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true, mode: 0o700 });
    }

    // Cargar el módulo WASM de SQL.js
    const SQL = await initSqlJs();

    // Si ya existe la base de datos en disco, la cargamos
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        // Si no existe, creamos una nueva
        db = new SQL.Database();
    }

    // Crear la tabla si no existe
    db.run(`
        CREATE TABLE IF NOT EXISTS historial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            placa TEXT,
            dni TEXT,
            resultado TEXT NOT NULL
        );
    `);

    // Guardar el archivo inmediatamente para asegurar la estructura
    persistir();
}

// Función auxiliar para guardar los cambios en el disco
function persistir() {
    if (!db) return;
    const data = db.export(); // Exporta a Uint8Array
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer, { mode: 0o600 });
}

function guardarHistorial(placa, dni, resultado) {
    if (!db) throw new Error("Base de datos no inicializada");
    const fecha = new Date().toISOString();
    const stmt = db.prepare(`
        INSERT INTO historial (fecha, placa, dni, resultado)
        VALUES (?, ?, ?, ?)
    `);
    stmt.run([fecha, placa || null, dni || null, JSON.stringify(resultado)]);
    stmt.free();
    persistir(); // Guardar en disco después de cada inserción
    return true;
}

function getHistorial() {
    if (!db) return [];
    const stmt = db.prepare(`SELECT * FROM historial ORDER BY id DESC LIMIT 50`);
    const rows = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        // Parsear el JSON de resultado
        row.resultado = JSON.parse(row.resultado);
        rows.push(row);
    }
    stmt.free();
    return rows;
}

module.exports = { init, guardarHistorial, getHistorial };
