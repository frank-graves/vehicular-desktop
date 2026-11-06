# Vehicular Desktop (Nivel Buzzheavier)

Aplicación de escritorio profesional construida con **Electron.js** y **Node.js**, cumpliendo con los estándares de seguridad y persistencia del proyecto *Buzzheavier Client*.

## 🎯 Características "Nivel Buzzheavier"
1. **Cifrado de Tokens (Zero-Access):** El token de `json.pe` se cifra localmente usando `AES-256-GCM` (módulo `crypto` de Node) antes de guardarse en el disco duro.
2. **Base de Datos Local (SQLite):** Utiliza `better-sqlite3` para guardar un historial persistente de las consultas realizadas, incluso si cierras la aplicación.
3. **Procesos Separados:** El frontend está aislado del backend mediante `contextBridge` (Preload), impidiendo inyecciones de código.
4. **Consumo de API en Node.js:** Las peticiones HTTP se hacen nativamente en Node.js usando `fetch`, ejecutando consultas en paralelo (`Promise.all`).

## 🚀 Requisitos Previos
- Node.js (v18 o superior).
- Herramientas de compilación para módulos nativos (Visual Studio C++ Build Tools en Windows) para poder instalar `better-sqlite3`.

## 🛠️ Instalación
1. Abre una terminal en esta carpeta.
2. Instala las dependencias:
   ```bash
   npm install
```

3. Inicia la aplicación:

```
npm start
```

## 📦 Generar el ejecutable (.exe)

Para empaquetar la aplicación como un `.exe` portable:

```
npm run build
```

El ejecutable se generará en la carpeta `dist/`.

## 🧠 ¿Cómo cumple esto con el sílabo PIAD-527?

- **HT-02 (Backend JS):** Uso de Node.js para manejo de archivos, cifrado, base de datos SQLite y peticiones HTTP.
- **HT-03 (Frontend JS):** Uso de JavaScript Vanilla para manipular el DOM y comunicación IPC.
- **HT-04 (API RESTful):** Conexión y consumo de una API RESTful externa (`json.pe`) manejando tokens y respuestas JSON.

