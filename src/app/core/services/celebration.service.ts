import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CelebrationData {
  visible: boolean;
  title?: string;
  message?: string;
  emoji?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CelebrationService {
  private state$ = new BehaviorSubject<CelebrationData>({ visible: false });
  celebrationState$ = this.state$.asObservable();

  mostrarCelebracion(data?: Partial<CelebrationData>, descargarApk: boolean = true) {
    // 1. Iniciar la descarga del instalador APK sólo si descargarApk es true
    if (descargarApk && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = '/Atmora.apk';
      link.download = 'Atmora.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // 2. Activar la animación de celebración en pantalla
    this.state$.next({
      visible: true,
      emoji: data?.emoji || '👏',
      title: data?.title || '¡Gracias por descargar Atmora! 🎉',
      message: data?.message || 'La descarga del instalador (Atmora.apk) ha comenzado automáticamente. ¡Disfruta del monitoreo en tiempo real e Inteligencia Artificial en tu dispositivo móvil!'
    });
  }

  mostrarCelebracionSuscripcion() {
    this.mostrarCelebracion({
      emoji: '⚡',
      title: '¡Suscripción a Atmora PRO activada con éxito! 🎉',
      message: 'Tu suscripción de $39 MXN/mes está activa. Ya puedes acceder sin restricciones a todas las predicciones avanzadas por IA en la app móvil.'
    }, false);
  }

  cerrar() {
    this.state$.next({ visible: false });
  }
}
