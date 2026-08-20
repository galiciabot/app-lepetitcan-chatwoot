# Le Petit Can - Sistema de Gestión de Peluquería Canina Premium

Este proyecto ha sido desarrollado e integrado con **React 19, TypeScript, Tailwind CSS y Firebase** para la plataforma de Le Petit Can.

## ⚠️ ¿Por qué la aplicación aparece blanca o le faltan cosas cuando se abre directamente?

Si intentas abrir el archivo `index.html` directamente haciendo doble clic desde el Explorador de Archivos (`file:///...`), **el navegador bloqueará la ejecución por seguridad (CORS)** y verás una página en blanco o incompleta.

Dado que es una aplicación moderna basada en **Vite y ES Modules (JavaScript Moderno)**, requiere ser procesada e instalada localmente con Node.js antes de ejecutarse en tu navegador.

---

## 🚀 Cómo inicializar y ejecutar la app en tu ordenador (Paso a Paso)

Para abrir la aplicación con toda su funcionalidad (calendario, citas, gestión de productos, servicios, configuración de descansos, etc.) de forma local, sigue estos sencillos pasos:

### Paso 1: Instalar Node.js
Si aún no lo tienes instalado, descarga e instala **Node.js** (versión LTS recomendada) desde su web oficial:
👉 [https://nodejs.org](https://nodejs.org)

*(El instalador de Node.js instalará automáticamente `npm`, que es el gestor de paquetes que necesitamos).*

### Paso 2: Descargar y descomprimir el proyecto
1. Descarga el archivo ZIP del proyecto (o haz un clon de tu repositorio de GitHub).
2. Extrae todos los archivos en una carpeta de tu ordenador (por ejemplo, en el Escritorio o Documentos).

### Paso 3: Abrir la terminal / consola
* **En Windows**: Abre la carpeta del proyecto, mantén presionada la tecla `Mayús` (Shift), haz clic derecho en cualquier espacio vacío dentro de la carpeta y selecciona **"Abrir ventana de PowerShell aquí"** o **"Abrir el Símbolo del sistema aquí"**.
* **En macOS**: Abre la terminal y escribe `cd ` seguido de arrastrar y soltar la carpeta de tu proyecto sobre la ventana de la terminal. Luego pulsa `Intro`.

### Paso 4: Instalar las dependencias
Escribe el siguiente comando y pulsa `Intro` para descargar todas las librerías necesarias (como React, Tailwind, Framer Motion, Firebase, etc.):
```bash
npm install
```
*(Espera un minuto o dos a que finalice la instalación. Se creará una carpeta llamada `node_modules` automáticamente).*

### Paso 5: Iniciar el servidor de desarrollo local
Ejecuta el siguiente comando para poner en marcha la aplicación:
```bash
npm run dev
```

### Paso 6: Abrir en tu navegador
Una vez iniciado el servidor, verás que la consola te indica una dirección web local, por lo general:
👉 **`http://localhost:3000`** o **`http://localhost:5173`**

Abre tu navegador de preferencia (Chrome, Edge, Safari, Firefox), escribe esa dirección en la barra de búsqueda y ¡listo! Podrás visualizar y gestionar toda la app web de Le Petit Can con todas sus secciones activas.

---

## 🛠️ Estructura del Proyecto

* **`/src/App.tsx`**: El archivo general de la aplicación que coordina el enrutamiento interno, el estado reactivo persistido y la lógica principal.
* **`/src/components/CalendarView.tsx`**: El calendario administrativo avanzado que muestra las citas semanales, diarias y mensuales, bloqueos de agenda y horarios asignados.
* **`/src/components/BreakConfigView.tsx`**: Panel dedicado a la gestión y configuración dinámica de los descansos y bloqueos recurrentes para evitar citas indeseadas.
* **`/src/components/BookingWidget.tsx`**: El widget de reserva de citas del cliente, el cual puede clonarse y embeberse directamente en cualquier sitio web externo como `www.lepetitcan.es`.
* **`/firebase-applet-config.json`**: Contiene las credenciales seguras de conexión a la base de datos de Firebase Firestore en la nube para que ninguna información de citas o productos se pierda.

---

## 📦 Construir para Producción (Guardar los archivos listos para internet)

Si alguna vez deseas subir esta web a tu propio hosting en internet (como Vercel, Netlify, Firebase Hosting, Hostinger, etc.):

1. Abre tu terminal en la carpeta del proyecto y ejecuta:
   ```bash
   npm run build
   ```
2. Esto creará una carpeta optimizada llamada `dist`.
3. Sube el contenido íntegro de esa carpeta `dist` a tu servidor de hosting favorito. ¡Estará lista para funcionar de cara a tus clientes en internet!
