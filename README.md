# ☁️ Atmora - Sistema Inteligente de Monitoreo Ambiental

Atmora es una plataforma integral de hardware y software diseñada para el monitoreo climático y de calidad del aire en tiempo real. Utiliza estaciones de sensores IoT (Arduino/ESP32) para recopilar datos ambientales y aplica modelos de Inteligencia Artificial (Machine Learning) para auditar las lecturas y generar pronósticos climáticos localizados.

## 🚀 Características Principales

* **Monitoreo IoT en Tiempo Real:** Recepción de datos de temperatura, humedad, presión, radiación solar, precipitación, viento y gases (CO2, CO, PM2.5, PM10).

* **Auditoría y Predicción con IA:** Pipeline de Machine Learning (Python/Scikit-Learn) que audita la coherencia de los sensores y pronostica variables climáticas a futuro.

* **Panel Web Administrativo:** Dashboard en Angular para visualización de métricas, gráficas históricas y gestión de dispositivos.

* **Suscripción Atmora PRO:** Integración con Mercado Pago para acceso a analíticas avanzadas.

* **Aplicación Móvil:** Acceso ciudadano a través de una app nativa (.apk).

## 🛠️ Tecnologías Utilizadas

* **Hardware (IoT):** Arduino / ESP32, C++, Sensores ambientales.

* **Backend:** Node.js, Express.js.

* **Base de Datos:** PostgreSQL.

* **Inteligencia Artificial:** Python 3, Pandas, Scikit-Learn (Regresión Lineal, K-Means, Random Forest).

* **Frontend:** Angular, Tailwind CSS.

* **Despliegue:** Railway (Backend/BD/Cron ML), Vercel (Frontend).

## ⚙️ Requisitos Previos

Para ejecutar este proyecto en un entorno local, asegúrese de tener instalado:

* [Node.js](https://nodejs.org/) (v16 o superior)

* [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

* [Python 3](https://www.python.org/downloads/) (v3.9 o superior) y `pip`

* [PostgreSQL](https://www.postgresql.org/) (v13 o superior)

*Nota: Por motivos de seguridad y cumpliendo con los lineamientos de evaluación, no se incluyen contraseñas ni credenciales globales en este repositorio.*

## 💻 Instalación y Ejecución Local

Siga estos pasos para levantar el entorno de desarrollo:

### 1. Clonar el repositorio

```
git clone https://github.com/TU_USUARIO/atmora.git
cd atmora

```

### 2. Configuración de la Base de Datos y Backend (Node.js)

1. Navegue a la carpeta del backend:

   ```
   cd backend
   
   ```

2. Instale las dependencias:

   ```
   npm install
   
   ```

3. Cree un archivo `.env` en la raíz de la carpeta `backend` basándose en el archivo `.env.example` proporcionado:

   ```
   PORT=3000
   DATABASE_URL=postgres://usuario:password@localhost:5432/atmora_db
   
   ```

4. Inicie el servidor de desarrollo:

   ```
   npm run dev
   
   ```

   *El servidor estará corriendo en `http://localhost:3000`.*

### 3. Configuración del Pipeline de IA (Python)

Los modelos de Machine Learning se ejecutan como un subproceso desde el backend, pero requieren sus propias librerías.

1. Navegue a la carpeta de Inteligencia Artificial (si aplica, usualmente dentro del backend):

   ```
   cd backend/ai
   
   ```

2. Instale las dependencias de Python:

   ```
   pip install -r requirements.txt
   
   ```

3. Para probar el reentrenamiento manual de los modelos:

   ```
   python reentrenar_modelos.py
   
   ```

### 4. Configuración del Frontend (Angular)

1. Abra una nueva terminal y navegue a la carpeta del frontend:

   ```
   cd frontend
   
   ```

2. Instale las dependencias:

   ```
   npm install
   
   ```

3. Ejecute la aplicación web:

   ```
   ng serve
   
   ```

   *El panel web estará disponible en `http://localhost:4200`.*

## 📱 Ejecutables y Entregables (.APK)

Para instalar la aplicación en un dispositivo móvil, puedes acceder a este enlace de la página principal donde podrás crear una cuenta y poder descargar la aplicación.

* **Ruta de la página: https://atmora-web.vercel.app** 

Para instalar la aplicación en un dispositivo Android:

1. Descargue el archivo `.apk` en su dispositivo móvil.

2. Habilite la opción de "Instalar aplicaciones de orígenes desconocidos" en la configuración de seguridad de su dispositivo.

3. Ejecute el archivo para completar la instalación.

**Desarrollado por alumnos de la UTCV Cuitláhuac. Atmora - 2026**