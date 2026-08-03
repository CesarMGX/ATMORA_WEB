import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

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

    // 1. Iniciar la descarga del archivo APK automáticamente
    const link = document.createElement('a');
    link.href = '/Atmora.apk';
    link.download = 'Atmora.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Mostrar la ventana emergente de agradecimiento por instalar la app
    Swal.fire({
      icon: 'success',
      title: '¡Gracias por descargar Atmora! 🎉',
      html: `
        <p style="color: #475569; font-size: 1.05rem; margin-top: 10px; line-height: 1.5;">
          La descarga del instalador (<strong>Atmora.apk</strong>) ha comenzado automáticamente.
        </p>
        <p style="color: #64748b; font-size: 0.95rem; margin-top: 8px;">
          Disfruta del monitoreo ambiental en tiempo real y la potencia de la Inteligencia Artificial en tu dispositivo móvil.
        </p>
      `,
      confirmButtonText: '¡Excelente, gracias!',
      confirmButtonColor: '#0f3460',
      background: '#ffffff'
    });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
