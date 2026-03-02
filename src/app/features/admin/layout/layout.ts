import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {

  // Datos del usuario (Simulado por ahora, luego lo tomamos del localStorage real)
  adminName = 'Admin Atmora'; 
  
  // Menú de navegación
  menuItems = [
    { label: 'Monitor Ambiental', icon: 'bx bx-bar-chart-alt-2', route: '/admin/monitor' },
    { label: 'Gestión de Usuarios', icon: 'bx bx-user-pin', route: '/admin/usuarios' },
    { label: 'Rosa de los Vientos', icon: 'bx bx-compass', route: '/admin/rosa-vientos' },
  ];

  constructor(private router: Router) {}

  logout() {
    // Limpiar seguridad
    localStorage.removeItem('userRole');
    localStorage.removeItem('lockoutEndTime'); // Opcional: limpiar castigos al salir
    
    // Redirigir al login
    this.router.navigate(['/auth']);
  }

}
