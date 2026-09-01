import sys
import os
import json
import warnings
warnings.filterwarnings("ignore")

import joblib
import pandas as pd

def main():
    # Validar número de argumentos
    if len(sys.argv) < 5:
        error_msg = {"status": "error", "message": "Se requieren 4 argumentos: Humedad, Presion, Radiacion, Algoritmo"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    try:
        humedad = float(sys.argv[1])
        presion = float(sys.argv[2])
        radiacion = float(sys.argv[3])
        algoritmo = sys.argv[4].lower().strip()

        # Si la presión enviada es <= 0 (sensor descalibrado o desconectado), usar 1013.25 hPa estándar
        if presion <= 0:
            presion = 1013.25
    except ValueError:
        error_msg = {"status": "error", "message": "Humedad, Presion y Radiacion deben ser valores numéricos"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    base_dir = os.path.dirname(os.path.abspath(__file__))

    if algoritmo == 'regresion':
        model_file = 'modelo_temperatura.pkl'
    elif algoritmo == 'kmeans':
        model_file = 'modelo_kmeans.pkl'
    else:
        error_msg = {"status": "error", "message": f"Algoritmo no válido: '{algoritmo}'. Opciones válidas: 'regresion' o 'kmeans'"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    model_path = os.path.join(base_dir, model_file)

    if not os.path.exists(model_path):
        error_msg = {"status": "error", "message": f"No se encontró el archivo del modelo en {model_path}"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    try:
        # Cargar modelo guardado (.pkl)
        model = joblib.load(model_path)

        # Crear DataFrame estrictamente con las lecturas numéricas y las features exactas del entrenamiento
        df = pd.DataFrame(
            [[humedad, presion, radiacion]],
            columns=['humedad', 'presion', 'radiacion_solar']
        )

        # Realizar la predicción
        prediccion = model.predict(df)

        if algoritmo == 'regresion':
            resultado_val = float(prediccion[0])
            
            # Clamp de seguridad: la temperatura predicha debe estar en el rango [-10°C, 60°C]
            anomalia = False
            if resultado_val < -10.0 or resultado_val > 60.0:
                anomalia = True
                resultado_val = max(-10.0, min(60.0, resultado_val))

            respuesta = {
                "temperatura_predicha": round(resultado_val, 2),
                "anomalia_detectada": anomalia
            }
        else:
            grupo_val = int(prediccion[0])
            respuesta = {
                "grupo": grupo_val
            }

        print(json.dumps(respuesta))

    except Exception as e:
        error_msg = {"status": "error", "message": f"Error al ejecutar la predicción: {str(e)}"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
