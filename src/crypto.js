/**
 * Módulo de cifrado local (Bóveda Segura).
 * Cifra los tokens en el disco usando AES-256-GCM para proteger la información.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ALGORITHM = 'aes-256-gcm';
const TOKEN_FILE = path.join(os.homedir(), '.vehicular', 'token.enc');

// Llave derivada (en un entorno real de producción esto vendría de una contraseña maestra)
// Para la tarea usamos una llave fija derivada del nombre de la app y un salt.
const SECRET = crypto.scryptSync('vehicular-app-secret-key', 'salt-vehicular', 32);

let memoryToken = null; // Caché en memoria para no leer el disco en cada consulta

function ensureDir() {
    const dir = path.dirname(TOKEN_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
}

function setToken(token) {
    if (!token) return;
    ensureDir();

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Guardamos IV + AuthTag + Texto cifrado
    const payload = JSON.stringify({ iv: iv.toString('hex'), authTag, encrypted });
    fs.writeFileSync(TOKEN_FILE, payload, { mode: 0o600 });
    
    memoryToken = token;
}

function getToken() {
    if (memoryToken) return memoryToken;
    if (!fs.existsSync(TOKEN_FILE)) return null;

    try {
        const payload = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET, Buffer.from(payload.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
        
        let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        memoryToken = decrypted;
        return decrypted;
    } catch (e) {
        console.error("Error al descifrar el token:", e.message);
        return null;
    }
}

function hasToken() {
    return !!getToken();
}

module.exports = { setToken, getToken, hasToken };
