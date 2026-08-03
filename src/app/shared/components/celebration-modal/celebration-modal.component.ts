import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CelebrationService, CelebrationData } from '../../../core/services/celebration.service';

export interface ConfettiPiece {
  top: number;
  left: number;
  color: string;
  transform: string;
  delay: number;
}

@Component({
  selector: 'app-celebration-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './celebration-modal.component.html',
  styleUrl: './celebration-modal.component.scss',
})
export class CelebrationModalComponent implements OnInit, OnDestroy {
  state: CelebrationData = { visible: false };
  confettiPieces: ConfettiPiece[] = [];
  private sub!: Subscription;

  constructor(
    private celebrationService: CelebrationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sub = this.celebrationService.celebrationState$.subscribe((state: CelebrationData) => {
      this.state = state;
      if (state.visible) {
        this.generarConfetti();
      } else {
        this.confettiPieces = [];
      }
      this.cdr.detectChanges();
    });
  }

  generarConfetti() {
    const colors = ['#0CD977', '#FF1C1C', '#FF93DE', '#5767ED', '#FFC61C', '#8497B0'];
    const pieces: ConfettiPiece[] = [];

    const width = typeof window !== 'undefined' ? (window.innerWidth || 1000) : 1000;
    const height = typeof window !== 'undefined' ? (window.innerHeight || 800) : 800;

    for (let i = 0; i < 200; i++) {
      const randomRotation = Math.floor(Math.random() * 360);
      const randomWidth = Math.floor(Math.random() * width);
      const randomHeight = Math.floor(Math.random() * height);
      const randomAnimationDelay = Math.floor(Math.random() * 10);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      pieces.push({
        top: randomHeight,
        left: randomWidth,
        color: randomColor,
        transform: `skew(15deg) rotate(${randomRotation}deg)`,
        delay: randomAnimationDelay
      });
    }

    this.confettiPieces = pieces;
  }

  cerrar() {
    this.celebrationService.cerrar();
  }

  cerrarAlHacerClicEnFondo(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('celebration-overlay') || (event.target as HTMLElement).classList.contains('wrapper')) {
      this.cerrar();
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
