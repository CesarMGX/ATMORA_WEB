import sys
import os
import warnings
warnings.filterwarnings("ignore")
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd

def main():
    # Validar número de argumentos
    if len(sys.argv) < 4:
        print("Error: Se requieren 3 argumentos (Humedad, Presion, Radiacion)", file=sys.stderr)
        sys.exit(1)

    try:
        # Convertir argumentos a flotantes
        humedad = float(sys.argv[1])
        presion = float(sys.argv[2])
        radiacion = float(sys.argv[3])
    except ValueError:
        print("Error: Los argumentos deben ser valores numéricos", file=sys.stderr)
        sys.exit(1)

    # Cargar el modelo
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'modelo_temperatura.pkl')

    if not os.path.exists(model_path):
        print(f"Error: No se encontró el archivo del modelo en {model_path}", file=sys.stderr)
        sys.exit(1)

    try:
        # Cargar el modelo guardado en pkl
        model = joblib.load(model_path)
        
        # Crear DataFrame con los nombres de características exactos con los que fue entrenado
        # Nota: 'Presion admosferica' contiene un error ortográfico en el entrenamiento original
        df = pd.DataFrame(
            [[humedad, presion, radiacion]], 
            columns=['Humedad exterior', 'Presion admosferica', 'Radiacion solar']
        )
        
        # Realizar la predicción
        prediccion = model.predict(df)
        
        # Imprimir el resultado de la predicción (temperatura) para que lo capture Node.js
        print(prediccion[0])
        
    except Exception as e:
        print(f"Error al cargar el modelo o realizar la predicción: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
