import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CelebrationService } from '../../../../core/services/celebration.service';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './precios.html',
  styleUrl: './precios.scss',
})
export class Precios {
  constructor(private celebrationService: CelebrationService) {}

  descargarApp(event: Event) {
    event.preventDefault();
    this.celebrationService.mostrarCelebracion();
  }
}
