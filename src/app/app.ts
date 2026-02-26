import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loading } from './shared/components/loading/loading';// Importa el componente
import { CommonModule } from '@angular/common'; // Importa CommonModule para el *ngIf
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loading, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
isLoading = true;

  // Esta función se ejecuta cuando el LoadingComponent dice "ya acabé"
  onLoadingFinish() {
    this.isLoading = false;
  }
}
