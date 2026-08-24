import os
import sys
import pandas as pd
import joblib
from sqlalchemy import create_engine
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans

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
    print(f"Iniciando extracción de datos para reentrenamiento continuo MLOps...")
    print(f"Conectando a base de datos...")
    
    try:
        engine = get_engine()
        
        # 2. Descargar el historial de sensores (soporta 'historial_sensores' o 'historial')
        try:
            query = "SELECT * FROM historial_sensores"
            df = pd.read_sql(query, engine)
        except Exception as e:
            query = "SELECT * FROM historial"
            df = pd.read_sql(query, engine)
    except Exception as db_err:
        print(f"⚠️ Error de conexión a PostgreSQL ({DATABASE_URL}): {db_err}")
        return

    df = df.dropna()
    if df.empty:
        print("⚠️ No hay suficientes datos limpios para reentrenar los modelos.")
        return

    print(f"📊 Registros recuperados para entrenamiento: {len(df)}")
    print("🤖 Entrenando IA de Auditoría y Clasificación (K-Means y Regresión Lineal)...")

    # --- ALGORITMO 1 y 2: K-MEANS Y REGRESIÓN LINEAL ---
    if 'radiacion_solar' not in df.columns and 'radiacion' in df.columns:
        df['radiacion_solar'] = df['radiacion']

    X_auditoria = df[['humedad', 'presion', 'radiacion_solar']]
    y_temp_real = df['temperatura']

    # K-Means
    modelo_kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    modelo_kmeans.fit(X_auditoria)
    joblib.dump(modelo_kmeans, os.path.join(BASE_DIR, 'modelo_kmeans.pkl'))
    print(" -> Guardado: modelo_kmeans.pkl")

    # Regresión Lineal Múltiple
    modelo_lin = LinearRegression()
    modelo_lin.fit(X_auditoria, y_temp_real)
    joblib.dump(modelo_lin, os.path.join(BASE_DIR, 'modelo_temperatura.pkl'))
    print(" -> Guardado: modelo_temperatura.pkl")

    print("🌲 Entrenando pronósticos a futuro (Bosques Aleatorios)...")

    # --- ALGORITMO 3: RANDOM FOREST (Para App Móvil) ---
    fecha_col = 'fecha_hora' if 'fecha_hora' in df.columns else 'fecha_registro'
    df[fecha_col] = pd.to_datetime(df[fecha_col])
    df['Mes'] = df[fecha_col].dt.month
    df['Dia'] = df[fecha_col].dt.day

    cols_sensores = ['temperatura', 'humedad', 'radiacion_solar', 'velocidad_viento', 'presion', 'co2', 'co']
    cols_existentes = [col for col in cols_sensores if col in df.columns]
    
    df_diario = df.groupby(['Mes', 'Dia'])[cols_existentes].mean().reset_index()
    X_fechas = df_diario[['Mes', 'Dia']]

    modelos_rf = {
        'temperatura': 'modelo_temperatura_fecha.pkl',
        'humedad': 'modelo_humedad.pkl',
        'radiacion_solar': 'modelo_radiacion.pkl',
        'velocidad_viento': 'modelo_viento.pkl',
        'presion': 'modelo_presion.pkl',
        'co2': 'modelo_co2.pkl',
        'co': 'modelo_co.pkl'
    }

    for variable, archivo_pkl in modelos_rf.items():
        if variable in df_diario.columns:
            modelo_rf = RandomForestRegressor(n_estimators=100, random_state=42)
            modelo_rf.fit(X_fechas, df_diario[variable])
            path_pkl = os.path.join(BASE_DIR, archivo_pkl)
            joblib.dump(modelo_rf, path_pkl)
            print(f" -> Guardado: {archivo_pkl}")

    print("✅ ¡Éxito! Todos los modelos de Inteligencia Artificial han sido reentrenados correctamente.")

if __name__ == "__main__":
    reentrenar_todo()