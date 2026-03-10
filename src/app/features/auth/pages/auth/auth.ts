import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../../core/services/auth';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

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

  // NUEVO: Aquí guardaremos temporalmente al usuario que logre pasar el login antes del MFA
  userFromDb: any = null;

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
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private http: HttpClient, // Inyectamos el cliente HTTP para la BD
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, sqlInjectionValidator, xssValidator]],
      password: ['', [Validators.required, sqlInjectionValidator, xssValidator]],
    });

    this.registerForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZÀ-ÿ ]*$'),
          sqlInjectionValidator,
          xssValidator,
        ],
      ],
      email: ['', [Validators.required, Validators.email, sqlInjectionValidator, xssValidator]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), sqlInjectionValidator, xssValidator],
      ],
    });

    this.registerForm.get('password')?.valueChanges.subscribe((val) => {
      this.calculateStrength(val);
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['mode'] === 'register') {
        this.isSignUpMode = true;
      }
    });
    this.checkLockoutStatus();
  }

  // --- LÓGICA DE BLOQUEO (Se mantiene igual) ---
  checkLockoutStatus() {
    const lockoutEnd = localStorage.getItem('lockoutEndTime');
    if (lockoutEnd) {
      const timeLeft = parseInt(lockoutEnd) - Date.now();
      if (timeLeft > 0) {
        this.isLockedOut = true;
        this.lockoutTimer = Math.ceil(timeLeft / 1000);
        this.loginErrorMsg = `⛔ Bloqueo activo por intentos fallidos.`;
        this.startLockoutTimer();
      } else {
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

  // --- SEGURIDAD DE CONTRASEÑA (Se mantiene igual) ---
  calculateStrength(password: string | null) {
    if (!password) {
      this.resetStrength();
      return;
    }
    const ctrl = { value: password } as AbstractControl;
    if (sqlInjectionValidator(ctrl)) {
      this.setSecurityError('Carácter SQL prohibido', 'red');
      return;
    }
    if (xssValidator(ctrl)) {
      this.setSecurityError('Script malicioso detectado', 'red');
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
        this.setStrength(25, 'Débil', '#e74c3c');
        break;
      case 2:
        this.setStrength(50, 'Regular', '#f1c40f');
        break;
      case 3:
        this.setStrength(75, 'Buena', '#2ecc71');
        break;
      case 4:
        this.setStrength(100, 'Excelente', '#27ae60');
        break;
    }
  }
  resetStrength() {
    this.passwordStrengthPercent = 0;
    this.passwordStrengthLabel = 'Ingresa una contraseña';
    this.passwordStrengthColor = '#e0e0e0';
  }
  setStrength(percent: number, label: string, color: string) {
    this.passwordStrengthPercent = percent;
    this.passwordStrengthLabel = label;
    this.passwordStrengthColor = color;
  }
  setSecurityError(label: string, color: string) {
    this.passwordStrengthLabel = label;
    this.passwordStrengthColor = color;
    this.passwordStrengthPercent = 100;
  }

  // ==========================================
  // LOGIN MIXTO (Quemado + Base de Datos)
  // ==========================================
  onLogin() {
    if (this.isLockedOut) return;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      // 1. Verificamos primero la "puerta trasera" del Admin quemado en código
      if (email === 'admin@atmora.com' && password === 'admin123') {
        // Simulamos un usuario traído de BD para que el MFA lo pueda usar
        this.userFromDb = {
          id: 999,
          nombre: 'Admin Supremo',
          correo: 'admin@atmora.com',
          rol: 'Admin',
          avatar: 'https://ui-avatars.com/api/?name=Admin+Supremo&background=f77f00&color=fff',
        };
        this.triggerMfaFlow('/admin', email);
        return; // Detenemos la función aquí, no buscamos en JSON
      }

      // 2. Si no es el admin quemado, buscamos en la base de datos (json-server)
      this.http
        .get<any[]>(`${environment.apiUrl}/usuarios?correo=${email}&password=${password}`)
        .subscribe({
          next: (users) => {
            if (users.length > 0) {
              this.userFromDb = users[0];

              // --- NUEVA LÓGICA DE REDIRECCIÓN ---
              let target = '/';
              if (this.userFromDb.rol === 'Admin') {
                target = '/admin';
              } else if (this.userFromDb.primerIngreso) {
                target = '/bienvenida'; // Si es su primera vez, lo mandamos aquí
              }

              this.triggerMfaFlow(target, email);
            }
          },
          error: () => {
            alert('Error al conectar con la base de datos local.');
          },
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  // Función de ayuda para no repetir código al pasar al MFA
  // Función de ayuda para no repetir código al pasar al MFA
  triggerMfaFlow(targetUrl: string, email: string) {
    this.failedAttempts = 0;
    localStorage.removeItem('lockoutEndTime');
    this.loginErrorMsg = '';
    this.pendingRedirectUrl = targetUrl;

    // Genera el código y lanza el alert
    this.generateAndSendCode(email);

    // Cambia la variable para mostrar el modal
    this.showMfaModal = true;

    // Obligamos a Angular a mostrar el modal INMEDIATAMENTE después del alert
    this.cdr.detectChanges();
  }

  // --- BLOQUEO POR INTENTOS ---
  handleLoginFailure() {
    this.failedAttempts++;
    const intentosRestantes = 3 - this.failedAttempts;

    if (this.failedAttempts >= 3) {
      this.isLockedOut = true;
      this.lockoutTimer = 30;
      this.loginErrorMsg = `⛔ Demasiados intentos. Bloqueo temporal activo.`;
      const endTime = Date.now() + 30 * 1000;
      localStorage.setItem('lockoutEndTime', endTime.toString());
      this.startLockoutTimer();
    } else {
      this.loginErrorMsg = `Credenciales incorrectas. Te quedan ${intentosRestantes} intentos.`;
    }
  }

  startLockoutTimer() {
    const interval = setInterval(() => {
      this.lockoutTimer--;
      this.cdr.detectChanges();
      if (this.lockoutTimer <= 0) {
        clearInterval(interval);
        this.isLockedOut = false;
        this.failedAttempts = 0;
        this.loginErrorMsg = '';
        localStorage.removeItem('lockoutEndTime');
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  // --- MFA Y CONEXIÓN CON EL NAVBAR ---
  generateAndSendCode(email: string) {
    this.generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[SIMULACIÓN DE EMAIL] \n\nHola,\nTu código de verificación es: ${this.generatedCode}`);
  }

  verifyMfaCode() {
    if (this.userMfaInput === this.generatedCode) {
      this.showMfaModal = false;

      // Inyectamos los datos reales (o el mock del admin) en el Cerebro (AuthService)
      // Esto hace que el Navbar reaccione instantáneamente
      this.authService.updateProfile({
        id: this.userFromDb.id,
        nombre: this.userFromDb.nombre,
        correo: this.userFromDb.correo,
        avatar: this.userFromDb.avatar,
        rol: this.userFromDb.rol,
      });

      this.router.navigate([this.pendingRedirectUrl]);
    } else {
      this.mfaError = true;
      setTimeout(() => (this.mfaError = false), 1000);
    }
  }

  // ==========================================
  // REGISTRO REAL (Guarda en json-server)
  // ==========================================
  onRegister() {
    if (this.registerForm.valid) {
      const formValues = this.registerForm.value;

      const newUser = {
        nombre: formValues.name,
        correo: formValues.email,
        password: formValues.password,
        rol: 'Usuario', // Todo el que se registra en la web es usuario normal por defecto
        estado: 'Activo',
        primerIngreso: true,
        fechaRegistro: new Date().toISOString().split('T')[0],
        avatar: `https://ui-avatars.com/api/?name=${formValues.name.replace(' ', '+')}&background=0f3460&color=fff`,
      };

      this.http.post(`${environment.apiUrl}/usuarios`, newUser).subscribe({
        next: () => {
          this.showSuccessModal = true;
        },
        error: (err) => {
          console.error('Error al registrar', err);
          alert('Hubo un error al guardar en la base de datos.');
        },
      });
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
