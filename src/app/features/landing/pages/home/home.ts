import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import AOS from 'aos'; // <--- Importa AOS

// CORRECCIÓN: Importamos desde los archivos reales (sin .component)
import { Navbar } from '../../components/navbar/navbar';
import { Hero } from '../../components/hero/hero';
import { Problema } from '../../components/problema/problema';
import { Solucion } from '../../components/solucion/solucion';
import { Beneficios } from '../../components/beneficios/beneficios';
import { Equipo } from '../../components/equipo/equipo';
import { Footer } from '../../components/footer/footer';
import { Precios } from '../../components/precios/precios';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Navbar, Hero, Problema, Solucion, Beneficios, Precios, Equipo, Footer],
  // CORRECCIÓN: Apuntamos a 'home.html' que es el archivo que sí existe
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
showBackToTop = false;

  ngOnInit() {
    // 1. EL TRUCO: Forzar el scroll hasta arriba inmediatamente
    window.scrollTo(0, 0);

    // 2. Iniciar animaciones AOS
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      offset: 100
    });
  }
  // Detectar scroll para mostrar el botón
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Si bajas más de 300px, aparece el botón
    this.showBackToTop = window.scrollY > 300;
  }

  // Función para subir suavemente
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
