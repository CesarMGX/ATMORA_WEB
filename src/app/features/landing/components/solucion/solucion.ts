import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CelebrationService } from '../../../../core/services/celebration.service';

@Component({
  selector: 'app-solucion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solucion.html',
  styleUrl: './solucion.scss',
})
export class Solucion implements AfterViewInit, OnDestroy {
  @ViewChild('appVideo') videoRef!: ElementRef<HTMLVideoElement>;
  private observer!: IntersectionObserver;

  constructor(private celebrationService: CelebrationService) {}

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && this.videoRef?.nativeElement) {
      const video = this.videoRef.nativeElement;
      video.muted = true;
      video.playsInline = true;

      // Disparar reproducción automática inteligente cuando la sección entra en el viewport del usuario
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(err => console.warn('Reproducción automática de video:', err));
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.2 });

      this.observer.observe(video);
    }
  }

  descargarApp(event: Event) {
    event.preventDefault();
    this.celebrationService.mostrarCelebracion();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
