import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, UserProfile } from '../../../core/services/auth';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {

  // Escuchamos al servicio de forma reactiva
  currentUser$: Observable<UserProfile | null>;
  
  // Menú de navegación
  menuItems = [
    { label: 'Monitor Ambiental', icon: 'bx bx-bar-chart-alt-2', route: '/admin/monitor' },
    { label: 'Gestión de Usuarios', icon: 'bx bx-user-pin', route: '/admin/usuarios' },
    { label: 'Rosa de los Vientos', icon: 'bx bx-compass', route: '/admin/rosa-vientos' },
  ];

  constructor(private authService: AuthService, private router: Router) {
    // Inicializamos la conexión con el "cerebro" de la app
    this.currentUser$ = this.authService.currentUser$;
  }

  logout() {
    // 1. Ejecutamos el cierre de sesión global del servicio
    this.authService.logout();

    // 2. Limpieza de seguridad adicional que ya tenías
    localStorage.removeItem('userRole');
    localStorage.removeItem('lockoutEndTime'); 
    
    // 3. Redirigir al login
    this.router.navigate(['/auth']);
  }

}