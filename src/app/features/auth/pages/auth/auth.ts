import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth';
import emailjs from '@emailjs/browser';

declare var google: any;

// --- VALIDACIONES DE SEGURIDAD ---
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
  imports: [RouterLink, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements OnInit, AfterViewInit {
  isSignUpMode = false;

  // Variables Modales
  showSuccessModal = false;
  showEmailSentModal = false;
  showMfaModal = false;

  // Variables MFA
  generatedCode = '';
  userMfaInput = '';
  mfaError = false;
  pendingRedirectUrl = '';

  // Variables MFA Bloqueo
  mfaFailedAttempts = 0;
  isMfaLockedOut = false;
  mfaLockoutTimer = 0;
  mfaLockoutMsg = '';

  // Datos del usuario autenticado temporalmente
  userFromDb: any = null;

  // Variables de Seguridad y Bloqueo
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
  // Nueva variable para el modal
  showCompleteProfileModal = false;
  completeProfileForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private http: HttpClient,
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

    this.completeProfileForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZÀ-ÿ ]*$'),
          sqlInjectionValidator,
          xssValidator,
        ],
      ],
      email: [{ value: '', disabled: true }, [Validators.required]], // Deshabilitado porque viene de Google
      password: [
        '',
        [Validators.required, Validators.minLength(8), sqlInjectionValidator, xssValidator],
      ],
    });

    // Para que la barra de fuerza también funcione con esta nueva contraseña
    this.completeProfileForm.get('password')?.valueChanges.subscribe((val) => {
      this.calculateStrength(val);
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
    this.checkMfaLockoutStatus();
  }

  ngAfterViewInit() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleResponse(response),
      });

      google.accounts.id.renderButton(document.getElementById('google-btn-signin'), {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      });

      google.accounts.id.renderButton(document.getElementById('google-btn-signup'), {
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
      });
    }
  }

  // ==========================================
  // LÓGICA DE GOOGLE AUTH
  // ==========================================
  handleGoogleResponse(response: any) {
    if (response.credential) {
      const payload = decodeURIComponent(
        atob(response.credential.split('.')[1])
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );

      const userData = JSON.parse(payload);
      const email = userData.email;
      const name = userData.name;
      const picture = userData.picture;

      this.http.get<any[]>(`${environment.apiUrl}/usuarios?correo=${email}`).subscribe({
        next: (users) => {
          if (users.length > 0) {
            this.userFromDb = users[0];
            let target = this.userFromDb.rol === 'Admin' ? '/admin' : '/';
            if (this.userFromDb.primerIngreso && this.userFromDb.rol !== 'Admin') {
              target = '/bienvenida';
            }
            this.triggerMfaFlow(target, email);
          } else {
            // Llenamos el formulario con los datos de Google
            this.completeProfileForm.patchValue({
              name: name,
              email: email,
            });
            // Guardamos la foto temporalmente
            this.userFromDb = { avatar: picture };

            // Mostramos el nuevo modal
            this.showCompleteProfileModal = true;
            this.cdr.detectChanges();
          }
        },
        error: () => console.error('Error al conectar con la base de datos.'),
      });
    }
  }

  // --- PERSISTENCIA DEL BLOQUEO ---
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
        this.loginErrorMsg = '';
      }
    }
    this.cdr.detectChanges();
  }

  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
    this.hideLoginPassword = true;
    this.hideRegisterPassword = true;
    this.loginErrorMsg = '';
  }

  // --- LÓGICA DE LOGIN MANUAL ---
  onLogin() {
    if (this.isLockedOut) return;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.http
        .get<any[]>(`${environment.apiUrl}/usuarios?correo=${email}&password=${password}`)
        .subscribe({
          next: (users) => {
            if (users.length > 0) {
              this.userFromDb = users[0];
              let target = this.userFromDb.rol === 'Admin' ? '/admin' : '/';
              if (this.userFromDb.primerIngreso && this.userFromDb.rol !== 'Admin') {
                target = '/bienvenida';
              }
              this.triggerMfaFlow(target, email);
            } else {
              this.handleLoginFailure();
            }
          },
          error: () => console.error('Error al conectar con la base de datos local.'),
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  // --- MANEJO DE FALLOS Y BLOQUEO ---
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
    this.cdr.detectChanges();
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

  // --- MFA Y EMAILJS FLOW ---
  async triggerMfaFlow(targetUrl: string, email: string) {
    this.failedAttempts = 0;
    localStorage.removeItem('lockoutEndTime');
    this.loginErrorMsg = '';
    this.pendingRedirectUrl = targetUrl;

    if (this.isMfaLockedOut) {
      this.showMfaModal = true; // Le abrimos el modal
      return; // Detenemos la función aquí. NO se envía ningún correo.
    }

    // Si no está bloqueado, procedemos a generar y enviar el código normal
    await this.generateAndSendCode(email);
  }

  async generateAndSendCode(email: string) {
    this.generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    const templateParams = {
      user_email: email,
      mfa_code: this.generatedCode,
    };

    try {
      await emailjs.send(
        environment.emailjs.serviceId,
        environment.emailjs.templateId,
        templateParams,
        environment.emailjs.publicKey,
      );

      this.showEmailSentModal = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
  }

  continueToMfa() {
    this.showEmailSentModal = false;
    this.showMfaModal = true;
    this.cdr.detectChanges();
  }

  verifyMfaCode() {
    if (this.isMfaLockedOut) return;

    if (this.userMfaInput === this.generatedCode) {
      // Limpiamos errores y entramos
      this.mfaFailedAttempts = 0;
      this.isMfaLockedOut = false;
      this.mfaLockoutMsg = '';
      this.showMfaModal = false;
      this.authService.updateProfile({
        id: this.userFromDb.id,
        nombre: this.userFromDb.nombre,
        correo: this.userFromDb.correo,
        avatar: this.userFromDb.avatar,
        rol: this.userFromDb.rol,
      });
      this.router.navigate([this.pendingRedirectUrl]);
    } else {
      this.mfaFailedAttempts++;
      const intentosRestantes = 5 - this.mfaFailedAttempts;

      if (this.mfaFailedAttempts >= 5) {
        // Bloquear por 5 minutos
        this.isMfaLockedOut = true;
        this.mfaLockoutTimer = 300;
        const endTime = Date.now() + 300 * 1000;
        localStorage.setItem('mfaLockoutEndTime', endTime.toString());
        this.startMfaLockoutTimer();
      } else {
        // Solo mostrar error y cuántos intentos le quedan
        this.mfaError = true;
        this.mfaLockoutMsg = `Código incorrecto. Te quedan ${intentosRestantes} intentos.`;
        setTimeout(() => {
          this.mfaError = false;
          this.cdr.detectChanges();
        }, 1500);
      }
    }
  }

  // --- LÓGICA DEL TEMPORIZADOR MFA ---
  checkMfaLockoutStatus() {
    const lockoutEnd = localStorage.getItem('mfaLockoutEndTime');
    if (lockoutEnd) {
      const timeLeft = parseInt(lockoutEnd) - Date.now();
      if (timeLeft > 0) {
        this.isMfaLockedOut = true;
        this.mfaLockoutTimer = Math.ceil(timeLeft / 1000);
        this.startMfaLockoutTimer();
      } else {
        localStorage.removeItem('mfaLockoutEndTime');
        this.isMfaLockedOut = false;
        this.mfaFailedAttempts = 0;
        this.mfaLockoutMsg = '';
      }
    }
  }

  startMfaLockoutTimer() {
    const interval = setInterval(() => {
      this.mfaLockoutTimer--;

      // Convertir segundos a formato MM:SS
      const minutos = Math.floor(this.mfaLockoutTimer / 60);
      const segundos = this.mfaLockoutTimer % 60;
      const tiempoFormat = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;

      this.mfaLockoutMsg = `Bloqueado. Intenta de nuevo en ${tiempoFormat}`;
      this.cdr.detectChanges();

      if (this.mfaLockoutTimer <= 0) {
        clearInterval(interval);
        this.isMfaLockedOut = false;
        this.mfaFailedAttempts = 0;
        this.mfaLockoutMsg = '';
        localStorage.removeItem('mfaLockoutEndTime');
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  // --- REGISTRO MANUAL ---
  onRegister() {
    if (this.registerForm.valid) {
      const formValues = this.registerForm.value;
      const newUser = {
        nombre: formValues.name,
        correo: formValues.email,
        password: formValues.password,
        rol: 'Usuario',
        estado: 'Activo',
        primerIngreso: true,
        fechaRegistro: new Date().toISOString().split('T')[0],
        avatar: `https://ui-avatars.com/api/?name=${formValues.name.replace(' ', '+')}&background=0f3460&color=fff`,
      };

      this.http.post(`${environment.apiUrl}/usuarios`, newUser).subscribe({
        next: () => {
          this.showSuccessModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Hubo un error al guardar en la base de datos.'),
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

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

  closeModalAndLogin() {
    this.showSuccessModal = false;
    this.isSignUpMode = false;
    this.registerForm.reset();
    this.resetStrength();
    this.cdr.detectChanges();
  }

  onCompleteProfile() {
    if (this.completeProfileForm.valid) {
      // getRawValue() nos permite leer el correo aunque el input esté deshabilitado
      const formValues = this.completeProfileForm.getRawValue();

      const newUser = {
        nombre: formValues.name,
        correo: formValues.email,
        password: formValues.password, // ¡La contraseña real!
        rol: 'Usuario',
        estado: 'Activo',
        primerIngreso: true,
        fechaRegistro: new Date().toISOString().split('T')[0],
        avatar:
          this.userFromDb?.avatar ||
          `https://ui-avatars.com/api/?name=${formValues.name.replace(' ', '+')}&background=0f3460&color=fff`,
      };

      this.http.post(`${environment.apiUrl}/usuarios`, newUser).subscribe({
        next: () => {
          this.showCompleteProfileModal = false; // Cerramos este modal
          this.showSuccessModal = true; // Mostramos la palomita verde
          this.isSignUpMode = false; // Lo mandamos al lado de Iniciar Sesión
          this.completeProfileForm.reset();
          this.cdr.detectChanges();
        },
        error: () => alert('Hubo un error al guardar en la base de datos.'),
      });
    } else {
      this.completeProfileForm.markAllAsTouched();
    }
  }
}
