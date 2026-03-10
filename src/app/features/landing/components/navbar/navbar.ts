import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, UserProfile } from '../../../../core/services/auth';
@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  isScrolled = false;
  menuOpen = false;
  activeSection: string = 'inicio';

  // --- NUEVAS VARIABLES PARA AUTH ---
  currentUser$: Observable<UserProfile | null>;
  isProfileMenuOpen = false;

  // Inyectamos el servicio de Auth y el Router
  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
    this.checkActiveSection();
  }

  checkActiveSection() {
    // AGREGUÉ 'equipo' AL FINAL DE ESTA LISTA
    const sections = ['inicio', 'problema', 'solucion', 'beneficios', 'precios', 'equipo'];

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Ajusté un poco el rango para que detecte mejor la sección final
        if (rect.top <= 150 && rect.bottom >= 150) {
          this.activeSection = section;
        }
      }
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // --- NUEVAS FUNCIONES PARA EL PERFIL ---
  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isProfileMenuOpen = false;
    this.router.navigate(['/']); // Redirigimos al inicio
  }
}