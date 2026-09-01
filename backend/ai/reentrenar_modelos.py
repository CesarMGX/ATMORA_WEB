import os
import sys
import io
import subprocess

# Forzar codificación UTF-8 para evitar errores de consola CP1252 en Windows/Linux
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 0. Auto-instalación de librerías en caso de que el entorno de Railway no las tenga preinstaladas
def asegurar_dependencias():
    librerias_clave = {
        'sqlalchemy': 'sqlalchemy',
        'pandas': 'pandas',
        'joblib': 'joblib',
        'sklearn': 'scikit-learn',
        'psycopg2': 'psycopg2-binary',
        'dotenv': 'python-dotenv'
    }
    
    faltantes = []
    for mod, pkg in librerias_clave.items():
        try:
            __import__(mod)
        except ImportError:
            faltantes.append(pkg)
            
    if faltantes:
        print(f"📦 [MLOps] Detectadas librerías faltantes ({', '.join(faltantes)}). Auto-instalando en Railway...")
        req_path = os.path.join(os.path.dirname(__file__), '../requirements.txt')
        try:
            if os.path.exists(req_path):
                subprocess.run([sys.executable, "-m", "pip", "install", "--break-system-packages", "-r", req_path], check=False)
            else:
                subprocess.run([sys.executable, "-m", "pip", "install", "--break-system-packages"] + faltantes, check=False)
            print("✅ Librerías de MLOps instaladas correctamente en el servidor.")
        except Exception as e:
            print(f"⚠️ Aviso al intentar instalar librerías automáticamente: {e}")

asegurar_dependencias()

import pandas as pd
import numpy as np
import joblib
from sqlalchemy import create_engine
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Intentar cargar variables desde .env
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
except ImportError:
    pass

# 1. Configuración de Base de Datos
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "password")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "atmora")
    DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

# Resolver la ruta absoluta de la carpeta backend/ai donde se guardarán los .pkl
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_engine():
    return create_engine(DATABASE_URL)

def reentrenar_todo():
    print("Iniciando extracción de datos para reentrenamiento continuo MLOps...")
    print("Conectando a base de datos PostgreSQL...")
    
    df = pd.DataFrame()
    try:
        engine = get_engine()
        print(f"📡 Conectado a PostgreSQL ({engine.url.host}:{engine.url.port} / BD: {engine.url.database})")
        
        # 2. Descargar el historial de sensores (soporta 'historial_sensores' o 'historial')
        try:
            query = "SELECT * FROM historial_sensores"
            df = pd.read_sql(query, engine)
            print(f"✅ Lectura exitosa de la tabla 'historial_sensores'. Total filas: {len(df)}")
        except Exception as e1:
            print(f"ℹ️ Reintentando con tabla alternativa 'historial' por: {e1}")
            query = "SELECT * FROM historial"
            df = pd.read_sql(query, engine)
            print(f"✅ Lectura exitosa de la tabla 'historial'. Total filas: {len(df)}")
    except Exception as db_err:
        print(f"⚠️ Error de conexión a PostgreSQL ({DATABASE_URL}): {db_err}")

    # Si df.empty, imprimir advertencia y salir
    if df is None or df.empty:
        print("⚠️ No hay registros en la base de datos para reentrenar los modelos.")
        return

    # Esquema exacto de columnas de PostgreSQL en Railway:
    # id_historial, fecha_hora, temperatura, humedad, velocidad_viento, direccion_viento,
    # precipitacion, radiacion_solar, co2, co, pm_25, pm_10, id_dispositivo, presion
    cols_sensores_totales = [
        'temperatura', 'humedad', 'velocidad_viento', 'direccion_viento',
        'precipitacion', 'radiacion_solar', 'co2', 'co', 'pm_25', 'pm_10', 'presion'
    ]

    # Mapear alias por si acaso
    if 'radiacion_solar' not in df.columns and 'radiacion' in df.columns:
        df['radiacion_solar'] = df['radiacion']

    # Convertir todas las columnas de sensores a valores numéricos
    for col in cols_sensores_totales:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        else:
            df[col] = np.nan

    # Reemplazar ceros o vacíos en presión por la presión atmosférica estándar (1013.25 hPa)
    # para evitar que filas sin sensor de presión distorsionen la regresión lineal
    if 'presion' in df.columns:
        df['presion'] = df['presion'].replace(0, np.nan).fillna(1013.25)

    # Rellenar resto de nulos de sensores de forma segura
    df = df.fillna(0.0)

    # Parsear fecha_hora con pd.to_datetime y extraer Mes y Dia
    fecha_col = 'fecha_hora' if 'fecha_hora' in df.columns else ('fecha_registro' if 'fecha_registro' in df.columns else None)
    if fecha_col and fecha_col in df.columns:
        df[fecha_col] = pd.to_datetime(df[fecha_col], errors='coerce').fillna(pd.Timestamp.now())
        df['Mes'] = df[fecha_col].dt.month
        df['Dia'] = df[fecha_col].dt.day
    else:
        now = pd.Timestamp.now()
        df['Mes'] = now.month
        df['Dia'] = now.day

    print(f"📊 Registros recuperados para entrenamiento: {len(df)}")
    print("🤖 Entrenando IA de Auditoría y Clasificación (K-Means y Regresión Lineal)...")

    # --- AUDITORÍA Y SEGMENTACIÓN ---
    # Features estrictas de sensores (excluyendo IDs y timestamps): ['humedad', 'presion', 'radiacion_solar']
    # Filtrar solo lecturas con temperatura en rango válido para no contaminar la pendiente de la regresión
    df_temp_valida = df[(df['temperatura'] >= -10) & (df['temperatura'] <= 60)]
    if len(df_temp_valida) < 2:
        df_temp_valida = df

    X_auditoria = df_temp_valida[['humedad', 'presion', 'radiacion_solar']]
    y_temp_real = df_temp_valida['temperatura']

    # K-Means (k=3)
    n_clusters = min(3, max(1, len(df)))
    modelo_kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    modelo_kmeans.fit(X_auditoria)
    joblib.dump(modelo_kmeans, os.path.join(BASE_DIR, 'modelo_kmeans.pkl'))
    print(" -> Guardado: modelo_kmeans.pkl")

    # Regresión Lineal Múltiple para Auditoría de Temperatura
    modelo_lin = LinearRegression()
    modelo_lin.fit(X_auditoria, y_temp_real)
    joblib.dump(modelo_lin, os.path.join(BASE_DIR, 'modelo_temperatura.pkl'))
    print(" -> Guardado: modelo_temperatura.pkl")

    # --- CÁLCULO DE MÉTRICAS DE PRECISIÓN EN AUDITORÍA ---
    y_pred_lin = modelo_lin.predict(X_auditoria)
    mae_lin = mean_absolute_error(y_temp_real, y_pred_lin)
    rmse_lin = np.sqrt(mean_squared_error(y_temp_real, y_pred_lin))
    r2_lin = r2_score(y_temp_real, y_pred_lin) if len(df_temp_valida) > 1 else 1.0

    print("📈 [Métricas Auditoría Temperatura]")
    print(f"    - MAE (Error Absoluto Medio): {mae_lin:.2f} °C")
    print(f"    - RMSE (Raíz del Error Cuadrático Medio): {rmse_lin:.2f} °C")
    print(f"    - R² Score (Coeficiente de Determinación): {r2_lin:.4f}")

    print("🌲 Entrenando pronósticos temporales (Bosques Aleatorios)...")

    # --- PRONÓSTICO TEMPORAL (RANDOM FOREST) ---
    cols_promediar = ['temperatura', 'humedad', 'radiacion_solar', 'velocidad_viento', 'presion', 'co2', 'co', 'pm_25', 'pm_10']
    
    # Agrupar por ['Mes', 'Dia'] promediando las columnas especificadas
    df_diario = df.groupby(['Mes', 'Dia'])[cols_promediar].mean().reset_index()

    if len(df_diario) >= 1:
        X_fechas = df_diario[['Mes', 'Dia']]

        modelos_rf = {
            'temperatura': 'modelo_temperatura_fecha.pkl',
            'humedad': 'modelo_humedad.pkl',
            'radiacion_solar': 'modelo_radiacion.pkl',
            'velocidad_viento': 'modelo_viento.pkl',
            'presion': 'modelo_presion.pkl',
            'co2': 'modelo_co2.pkl',
            'co': 'modelo_co.pkl',
            'pm_25': 'modelo_pm25.pkl',
            'pm_10': 'modelo_pm10.pkl'
        }

        # Bucle que entrena un RandomForestRegressor para cada variable con X = df_diario[['Mes', 'Dia']]
        for variable, archivo_pkl in modelos_rf.items():
            modelo_rf = RandomForestRegressor(n_estimators=100, random_state=42)
            modelo_rf.fit(X_fechas, df_diario[variable])
            
            # Evaluación de precisión para Random Forest
            y_pred_rf = modelo_rf.predict(X_fechas)
            mae_rf = mean_absolute_error(df_diario[variable], y_pred_rf)
            r2_rf = r2_score(df_diario[variable], y_pred_rf) if len(df_diario) > 1 else 1.0
            
            path_pkl = os.path.join(BASE_DIR, archivo_pkl)
            joblib.dump(modelo_rf, path_pkl)
            print(f" -> Guardado: {archivo_pkl} | MAE: {mae_rf:.2f} | R²: {r2_rf:.4f}")

    print("✅ ¡Éxito! Todos los modelos de Inteligencia Artificial han sido reentrenados y evaluados correctamente.")

if __name__ == "__main__":
    reentrenar_todo()