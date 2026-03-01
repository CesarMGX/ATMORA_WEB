import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms'; 
import { ChangeDetectorRef } from '@angular/core'; 

export function sqlInjectionValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const sqlPattern = /[';]|\-\-/;
  return sqlPattern.test(value) ? { sqlInjection: true } : null;
}

export function xssValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const xssPattern = /<script\b[^>]*>|on\w+\s*=|javascript:|vbscript:|data:/i;
  const detected = xssPattern.test(value);
  return detected ? { xssDetected: true } : null;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements OnInit {
  isSignUpMode = false;
  showSuccessModal = false;

  // Variables MFA
  showMfaModal = false;
  generatedCode = '';
  userMfaInput = '';
  mfaError = false;
  pendingRedirectUrl = '';

  // Variables Fuerza Bruta
  failedAttempts = 0;
  isLockedOut = false;
  lockoutTimer = 0;
  loginErrorMsg = '';

  // Variables Visuales
  hideLoginPassword = true;
  hideRegisterPassword = true;
  passwordStrengthPercent = 0;
  passwordStrengthLabel = 'Ingresa una contraseña';
  passwordStrengthColor = '#e0e0e0';

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, sqlInjectionValidator, xssValidator]], 
      password: ['', [Validators.required, sqlInjectionValidator, xssValidator]] 
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ ]*$'), sqlInjectionValidator, xssValidator]], 
      email: ['', [Validators.required, Validators.email, sqlInjectionValidator, xssValidator]], 
      password: ['', [Validators.required, Validators.minLength(8), sqlInjectionValidator, xssValidator]] 
    });

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

    // --- 1. VERIFICAR BLOQUEO AL CARGAR LA PÁGINA ---
    this.checkLockoutStatus();
  }

  // --- NUEVA FUNCIÓN: Revisar si hay un bloqueo pendiente ---
  checkLockoutStatus() {
    const lockoutEnd = localStorage.getItem('lockoutEndTime');
    
    if (lockoutEnd) {
      const timeLeft = parseInt(lockoutEnd) - Date.now();
      
      if (timeLeft > 0) {
        // Todavía está castigado: Retomamos el bloqueo
        this.isLockedOut = true;
        this.lockoutTimer = Math.ceil(timeLeft / 1000); // Convertir ms a segundos
        this.loginErrorMsg = `⛔ Bloqueo activo por intentos fallidos.`;
        this.startLockoutTimer(); // Iniciar cuenta regresiva
      } else {
        // El tiempo ya pasó mientras estaba fuera: Limpiamos
        localStorage.removeItem('lockoutEndTime');
        this.isLockedOut = false;
        this.failedAttempts = 0;
      }
    }
  }

  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
    this.hideLoginPassword = true;
    this.hideRegisterPassword = true;
  }

  calculateStrength(password: string | null) {
      if (!password) { this.resetStrength(); return; }
      const ctrl = { value: password } as AbstractControl;
      if (sqlInjectionValidator(ctrl)) { this.setSecurityError('Carácter SQL prohibido', 'red'); return; }
      if (xssValidator(ctrl)) { this.setSecurityError('Script malicioso detectado', 'red'); return; }
      
      let score = 0;
      if (password.length >= 8) score += 1;
      if (password.match(/[0-9]/)) score += 1;
      if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 1;
      if (password.match(/[^a-zA-Z0-9]/)) score += 1; 
      switch (score) {
        case 0: case 1: this.setStrength(25, 'Débil', '#e74c3c'); break;
        case 2: this.setStrength(50, 'Regular', '#f1c40f'); break;
        case 3: this.setStrength(75, 'Buena', '#2ecc71'); break;
        case 4: this.setStrength(100, 'Excelente', '#27ae60'); break;
      }
  }
  resetStrength() { this.passwordStrengthPercent = 0; this.passwordStrengthLabel = 'Ingresa una contraseña'; this.passwordStrengthColor = '#e0e0e0'; }
  setStrength(percent: number, label: string, color: string) { this.passwordStrengthPercent = percent; this.passwordStrengthLabel = label; this.passwordStrengthColor = color; }
  setSecurityError(label: string, color: string) { this.passwordStrengthLabel = label; this.passwordStrengthColor = color; this.passwordStrengthPercent = 100; }

  onLogin() {
    if (this.isLockedOut) return;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      let isValidUser = false;
      let targetUrl = '/';

      if (email === 'admin@atmora.com' && password === 'admin123') {
        isValidUser = true;
        targetUrl = '/admin';
      } else if (email === 'usuario@atmora.com' && password === 'user123') {
        isValidUser = true;
        targetUrl = '/';
      }

      if (isValidUser) {
        this.failedAttempts = 0;
        localStorage.removeItem('lockoutEndTime'); // Limpiar bloqueo si entra bien
        this.loginErrorMsg = '';
        this.pendingRedirectUrl = targetUrl;
        this.generateAndSendCode(email);
        this.showMfaModal = true;
      } else {
        this.handleLoginFailure();
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  // --- 2. MODIFICADO: Guardar bloqueo en LocalStorage ---
  handleLoginFailure() {
    this.failedAttempts++;
    const intentosRestantes = 3 - this.failedAttempts;

    if (this.failedAttempts >= 3) {
      this.isLockedOut = true;
      this.lockoutTimer = 30; // 30 segundos
      this.loginErrorMsg = `⛔ Demasiados intentos. Bloqueo temporal activo.`;

      // GUARDAMOS LA HORA EXACTA EN QUE TERMINA EL BLOQUEO
      // (Hora actual + 30,000 milisegundos)
      const endTime = Date.now() + (30 * 1000);
      localStorage.setItem('lockoutEndTime', endTime.toString());
      
      this.startLockoutTimer();

    } else {
      this.loginErrorMsg = `Credenciales incorrectas. Te quedan ${intentosRestantes} intentos.`;
    }
  }

  // --- 3. NUEVO: Función auxiliar del temporizador ---
  startLockoutTimer() {
    const interval = setInterval(() => {
      this.lockoutTimer--;
      this.cdr.detectChanges(); 
      
      if (this.lockoutTimer <= 0) {
        clearInterval(interval);
        
        // DESBLOQUEO
        this.isLockedOut = false;
        this.failedAttempts = 0;
        this.loginErrorMsg = '';
        localStorage.removeItem('lockoutEndTime'); // Borramos la marca
        
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  generateAndSendCode(email: string) {
    this.generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[SIMULACIÓN DE EMAIL] \n\nHola usuario de Atmora,\nTu código de verificación es: ${this.generatedCode}`);
    console.log('Código MFA:', this.generatedCode);
  }

  verifyMfaCode() {
    if (this.userMfaInput === this.generatedCode) {
      this.showMfaModal = false;
      localStorage.removeItem('userRole');
      if (this.pendingRedirectUrl === '/admin') {
        localStorage.setItem('userRole', 'admin'); 
      } else {
        localStorage.setItem('userRole', 'user');
      }
      this.router.navigate([this.pendingRedirectUrl]);
    } else {
      this.mfaError = true;
      setTimeout(() => this.mfaError = false, 1000);
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
    this.resetStrength();
  }
}