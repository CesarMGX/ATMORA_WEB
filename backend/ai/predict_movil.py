import sys
import os
import json
import warnings
warnings.filterwarnings("ignore")

import joblib
import pandas as pd

def main():
    # Validar número de argumentos
    if len(sys.argv) < 4:
        error_msg = {"status": "error", "message": "Se requieren 3 argumentos: Mes, Dia, Tipo"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    try:
        mes = int(sys.argv[1])
        dia = int(sys.argv[2])
        tipo = sys.argv[3].lower().strip()
    except ValueError:
        error_msg = {"status": "error", "message": "Mes y Dia deben ser valores numéricos enteros"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    # Mapeo de tipos de predicción a sus respectivos archivos .pkl
    modelos = {
        'humedad': 'modelo_humedad.pkl',
        'radiacion': 'modelo_radiacion.pkl',
        'viento': 'modelo_viento.pkl',
        'presion': 'modelo_presion.pkl'
    }

    if tipo not in modelos:
        error_msg = {"status": "error", "message": f"Tipo de predicción inválido: '{tipo}'. Opciones válidas: humedad, radiacion, viento, presion"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, modelos[tipo])

    if not os.path.exists(model_path):
        error_msg = {"status": "error", "message": f"No se encontró el archivo del modelo en {model_path}"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

    try:
        # Cargar el modelo .pkl con joblib
        model = joblib.load(model_path)

        # Crear el DataFrame con ['Mes', 'Dia']
        df = pd.DataFrame([[mes, dia]], columns=['Mes', 'Dia'])

        # Realizar la predicción
        prediccion = model.predict(df)
        resultado = float(prediccion[0])

        # Imprimir resultado en consola en formato JSON
        respuesta = {
            "resultado": round(resultado, 2)
        }
        print(json.dumps(respuesta))

    except Exception as e:
        error_msg = {"status": "error", "message": f"Error al ejecutar la predicción: {str(e)}"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
