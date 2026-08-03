import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import AOS from 'aos';

import { Navbar } from '../../components/navbar/navbar';
import { Hero } from '../../components/hero/hero';
import { Problema } from '../../components/problema/problema';
import { Solucion } from '../../components/solucion/solucion';
import { Beneficios } from '../../components/beneficios/beneficios';
import { Equipo } from '../../components/equipo/equipo';
import { Footer } from '../../components/footer/footer';
import { Precios } from '../../components/precios/precios';
import { CelebrationModalComponent } from '../../../../shared/components/celebration-modal/celebration-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    Navbar,
    Hero,
    Problema,
    Solucion,
    Beneficios,
    Precios,
    Equipo,
    Footer,
    CelebrationModalComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  showBackToTop = false;

  ngOnInit() {
    window.scrollTo(0, 0);

    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      offset: 100
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
