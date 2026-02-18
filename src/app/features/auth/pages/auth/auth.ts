import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  imports: [RouterLink, CommonModule,],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements OnInit {
isSignUpMode = false;

  // 4. Inyectamos la ruta para poder leer la URL
  constructor(private route: ActivatedRoute) {}

  // 5. Al iniciar, verificamos si hay mensaje
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // Si en la URL dice "?mode=register", activamos el modo registro
      if (params['mode'] === 'register') {
        this.isSignUpMode = true;
      }
    });
  }

  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
  }
}
