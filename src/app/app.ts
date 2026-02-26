import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // <--- 1. Importar CommonModule
// Asegúrate de que la ruta sea correcta según donde creaste el componente:
import { Loading } from './shared/components/loading/loading';
@Component({
  selector: 'app-root',
  standalone: true,
  // 2. AGREGAR AQUÍ LOS MÓDULOS QUE USAMOS EN EL HTML
  imports: [RouterOutlet, CommonModule, Loading], 
  templateUrl: './app.html', // Según tu error, tu archivo se llama así
  styleUrl: './app.scss'     // Asumo que tienes un app.scss o app.css
})
export class App { // Tu error dice que la clase se llama 'App'
  
  // 3. VARIABLES Y FUNCIONES FALTANTES
  isLoading = true;

  onLoadingFinish() {
    this.isLoading = false;
  }
}