import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements OnInit {
  isSignUpMode = false;
  showSuccessModal = false;

  // --- NUEVAS VARIABLES PARA EL OJO (VER PASSWORD) ---
  hideLoginPassword = true;
  hideRegisterPassword = true;

  // --- NUEVAS VARIABLES PARA LA BARRA DE FUERZA ---
  passwordStrengthPercent = 0;
  passwordStrengthLabel = 'Ingresa una contraseña';
  passwordStrengthColor = '#e0e0e0';

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    // 1. Configuración Login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // 2. Configuración Registro
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ ]*$')]], 
      email: ['', [Validators.required, Validators.email]],
      // Aumenté a 8 caracteres para que la barra de fuerza tenga sentido
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // ESCUCHAR CAMBIOS EN LA CONTRASEÑA DE REGISTRO
    this.registerForm.get('password')?.valueChanges.subscribe(val => {
      this.calculateStrength(val);
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'register') {
        this.isSignUpMode = true;
      }
    });
  }

  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
    // Reseteamos los ojos al cambiar
    this.hideLoginPassword = true;
    this.hideRegisterPassword = true;
  }

  // --- LÓGICA DE FUERZA DE CONTRASEÑA ---
  calculateStrength(password: string | null) {
    if (!password) {
      this.passwordStrengthPercent = 0;
      this.passwordStrengthLabel = 'Ingresa una contraseña';
      this.passwordStrengthColor = '#e0e0e0';
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 1;
    if (password.match(/[^a-zA-Z0-9]/)) score += 1;

    switch (score) {
      case 0:
      case 1:
        this.passwordStrengthPercent = 25;
        this.passwordStrengthLabel = 'Débil';
        this.passwordStrengthColor = '#e74c3c'; // Rojo
        break;
      case 2:
        this.passwordStrengthPercent = 50;
        this.passwordStrengthLabel = 'Regular';
        this.passwordStrengthColor = '#f1c40f'; // Amarillo
        break;
      case 3:
        this.passwordStrengthPercent = 75;
        this.passwordStrengthLabel = 'Buena';
        this.passwordStrengthColor = '#2ecc71'; // Verde
        break;
      case 4:
        this.passwordStrengthPercent = 100;
        this.passwordStrengthLabel = 'Excelente';
        this.passwordStrengthColor = '#27ae60'; // Verde fuerte
        break;
    }
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (email === 'admin@atmora.com' && password === 'admin123') {
        console.log('--- MODO DIOS ACTIVADO ---');
        this.router.navigate(['/admin']);
      } else {
        console.log('--- Bienvenido Ciudadano ---');
        this.router.navigate(['/']);
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.showSuccessModal = true;
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  closeModalAndLogin() {
    this.showSuccessModal = false;
    this.isSignUpMode = false;
    this.registerForm.reset();
    this.passwordStrengthPercent = 0;
  }
}