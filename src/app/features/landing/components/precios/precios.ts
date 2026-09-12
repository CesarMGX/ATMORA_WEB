import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { AtmoraService } from '../../../../core/services/atmora.service';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './precios.html',
  styleUrl: './precios.scss',
})
export class Precios implements OnInit {
  cargandoPago = false;
  mostrarModalExito = false;
  mensajeError: string | null = null;

  constructor(
    private celebrationService: CelebrationService,
    private atmoraService: AtmoraService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Escuchar parámetros de retorno de Mercado Pago en la URL (?status=success/failure/pending)
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status === 'success') {
        this.mostrarModalExito = true;
        // Refrescar el estado del perfil en la sesión local a PRO_MENSUAL
        this.authService.actualizarSuscripcion('PRO_MENSUAL');
        this.celebrationService.mostrarCelebracion();
      } else if (status === 'failure') {
        this.mensajeError = 'El pago de la suscripción no pudo ser completado. Por favor, intenta de nuevo.';
      } else if (status === 'pending') {
        this.mensajeError = 'Tu pago está pendiente de confirmación. Te notificaremos en cuanto sea aprobado.';
      }
    });
  }

  descargarApp(event: Event) {
    event.preventDefault();
    this.celebrationService.mostrarCelebracion();
  }

  obtenerPro(event: Event) {
    event.preventDefault();
    this.cargandoPago = true;
    this.mensajeError = null;

    // Obtener usuario autenticado actual o usar ID por defecto
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser ? currentUser.id : 1;
    const userEmail = currentUser ? currentUser.correo : 'usuario@atmora.com';

    this.atmoraService.crearSuscripcionPro(userId, userEmail).subscribe({
      next: (res: any) => {
        this.cargandoPago = false;
        const redirectUrl = res.init_point || res.sandbox_init_point;
        if (redirectUrl) {
          // Redirigir al Checkout / PreApproval de Mercado Pago
          window.location.href = redirectUrl;
        } else {
          this.mensajeError = 'No se pudo obtener el enlace de pago de Mercado Pago.';
        }
      },
      error: (err: any) => {
        this.cargandoPago = false;
        console.error('Error al generar suscripción de Mercado Pago:', err);
        this.mensajeError = 'Ocurrió un error al conectar con Mercado Pago. Intenta nuevamente.';
      }
    });
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
  }

  irAlPanel() {
    this.mostrarModalExito = false;
    this.router.navigate(['/admin/dashboard']);
  }
}
