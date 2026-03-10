import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, UserProfile } from '../../../../core/services/auth';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-bienvenida',
  imports: [CommonModule],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.scss',
})

export class Bienvenida implements OnInit {
  user: UserProfile | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    // Si por alguna razón entra aquí alguien sin sesión, lo rebotamos
    if (!this.user) {
      this.router.navigate(['/auth']);
    }
  }

  comenzar() {
    if (this.user) {
      // 1. Le decimos a db.json que este usuario ya NO es nuevo (PATCH actualiza solo ese campo)
      this.http.patch(`${environment.apiUrl}/usuarios/${this.user.id}`, { primerIngreso: false })
        .subscribe({
          next: () => {
            // 2. Lo mandamos a la página principal
            this.router.navigate(['/']);
          },
          error: () => {
            // Si falla la red, de todos modos lo dejamos pasar
            this.router.navigate(['/']);
          }
        });
    }
  }
}
