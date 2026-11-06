# Vehicular Desktop

Aplicación de escritorio profesional construida con **Electron.js**, **Node.js** y **SQLite**. Diseñada para realizar consultas vehiculares de manera rápida, segura y con persistencia de datos local.

## 🎯 Características Principales
1. **Bóveda de Tokens Segura:** Los tokens de acceso se cifran localmente usando `AES-256-GCM` (a través del módulo nativo `crypto` de Node.js) antes de guardarse en el disco.
2. **Base de Datos Local:** Utiliza `sql.js` (SQLite compilado a WebAssembly) para guardar un historial de consultas sin necesidad de compilar módulos nativos de C++.
3. **Rotación de Tokens:** Capacidad de almacenar múltiples tokens y rotarlos automáticamente si uno alcanza su límite de cuota.
4. **Arquitectura Segura:** El frontend está aislado del backend mediante `contextBridge` (Preload), previniendo inyecciones de código.
5. **Consultas en Paralelo:** Las peticiones HTTP se ejecutan simultáneamente usando `Promise.all`.

## 🚀 Requisitos Previos
- Node.js (v18 o superior).
- No requiere Visual Studio C++ Build Tools (gracias al uso de WebAssembly).

## 🛠️ Instalación y Uso
1. Abre una terminal en la carpeta del proyecto.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia la aplicación en modo desarrollo:
   ```bash
   npm start
   ```

## 📦 Generar el ejecutable (.exe)
Para empaquetar la aplicación como un archivo `.exe` portable:
```bash
npm run build
```
El ejecutable se generará en la carpeta `dist/`.

## 🧠 Arquitectura del Proyecto
- **`main.js`**: Proceso principal de Electron, maneja la ventana y la comunicación IPC.
- **`preload.js`**: Puente seguro entre el frontend y el backend.
- **`src/crypto.js`**: Lógica de cifrado y almacenamiento de tokens.
- **`src/db.js`**: Gestión de la base de datos SQLite en WebAssembly.
- **`src/api.js`**: Cliente HTTP para interactuar con la API externa.
- **`frontend/`**: Interfaz de usuario (HTML, CSS, JavaScript puro).
