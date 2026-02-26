import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  imports: [CommonModule],
  templateUrl: './loading.html',
  styleUrl: './loading.scss',
})
export class Loading implements OnInit {
@Output() finish = new EventEmitter<void>();
  
  progress: number = 0;
  isFadingOut: boolean = false;

  // Inyectamos ChangeDetectorRef para obligar a actualizar la pantalla si se traba
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.startLoading();
  }

  startLoading() {
    const interval = setInterval(() => {
      // Incrementamos el progreso
      this.progress++;

      // Obligamos a Angular a detectar el cambio (por si acaso)
      this.cdr.detectChanges();

      // Si llega a 100, paramos
      if (this.progress >= 100) {
        clearInterval(interval);
        this.closeLoader();
      }
    }, 30); // 30ms de velocidad
  }

  closeLoader() {
    setTimeout(() => {
      this.isFadingOut = true;
      setTimeout(() => {
        this.finish.emit();
      }, 500);
    }, 200);
  }

}
