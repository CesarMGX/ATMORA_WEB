import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../../../core/services/auth';
import { AtmoraService } from '../../../../core/services/atmora.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class Perfil implements OnInit {
  user: UserProfile = { id: 0, nombre: '', correo: '', avatar: '', rol: 'Usuario' };
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  // Campos de Seguridad (Cambio de Contraseña)
  mostrarCambioPassword = false;
  newPassword = '';
  confirmPassword = '';

  // Estados de carga
  cargandoGuardar = false;
  cargandoEliminar = false;

  constructor(
    private authService: AuthService,
    private atmoraService: AtmoraService,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = { ...currentUser };
      this.previewUrl = this.user.avatar;
    }
  }

  // Previsualizar la foto antes de guardar y almacenar la referencia al archivo seleccionado
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'Archivo muy pesado',
          text: 'La imagen seleccionada supera el límite máximo de 5MB.',
          confirmButtonColor: '#0f3460'
        });
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  toggleCambioPassword() {
    this.mostrarCambioPassword = !this.mostrarCambioPassword;
    if (!this.mostrarCambioPassword) {
      this.newPassword = '';
      this.confirmPassword = '';
    }
  }

  guardarCambios() {
    if (!this.user.nombre || !this.user.correo) {
      Swal.fire({
        icon: 'error',
        title: '¡Campos requeridos!',
        text: 'El nombre completo y el correo electrónico son obligatorios.',
        confirmButtonColor: '#0f3460'
      });
      return;
    }

    // Validar coincidencia y longitud de la contraseña si se especificó
    if (this.mostrarCambioPassword || this.newPassword.trim().length > 0) {
      if (this.newPassword.length < 6) {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña poco segura',
          text: 'La nueva contraseña debe tener al menos 6 caracteres.',
          confirmButtonColor: '#0f3460'
        });
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        Swal.fire({
          icon: 'error',
          title: 'Las contraseñas no coinciden',
          text: 'Por favor verifica que ambas contraseñas escritas coincidan.',
          confirmButtonColor: '#0f3460'
        });
        return;
      }
    }

    this.cargandoGuardar = true;

    // Si se seleccionó una nueva foto de perfil, subir a Cloudinary primero
    if (this.selectedFile) {
      this.atmoraService.subirFotoPerfil(this.selectedFile).subscribe({
        next: (res: any) => {
          const cloudinaryUrl = res.secure_url || res.url;
          if (cloudinaryUrl) {
            this.user.avatar = cloudinaryUrl;
            this.previewUrl = cloudinaryUrl;
          }
          this.selectedFile = null;
          this.ejecutarActualizacionUsuario();
        },
        error: (err: any) => {
          console.error('Error al subir foto:', err);
          Swal.fire({
            icon: 'warning',
            title: 'Subida parcial',
            text: 'No se pudo subir la foto. Se continuará guardando los demás datos.',
            timer: 2500,
            showConfirmButton: false
          });
          this.ejecutarActualizacionUsuario();
        }
      });
    } else {
      this.ejecutarActualizacionUsuario();
    }
  }

  private ejecutarActualizacionUsuario() {
    const updatePayload: any = {
      nombre: this.user.nombre,
      correo: this.user.correo,
      avatar: this.user.avatar
    };

    if (this.newPassword.trim().length > 0) {
      updatePayload.password = this.newPassword.trim();
    }

    const userId = this.user.id || 1;

    this.atmoraService.actualizarUsuario(userId, updatePayload).subscribe({
      next: (res: any) => {
        this.cargandoGuardar = false;

        // Actualizar sesión local y navbar/perfil mediante AuthService
        this.authService.updateProfile(this.user);

        // Limpiar campos de contraseña
        this.newPassword = '';
        this.confirmPassword = '';
        this.mostrarCambioPassword = false;

        Swal.fire({
          icon: 'success',
          title: '¡Perfil Actualizado!',
          text: 'Tu foto de perfil y tus datos se han actualizado correctamente.',
          timer: 2200,
          showConfirmButton: false
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoGuardar = false;
        console.error('Error al actualizar en backend:', err);
        
        // Mantener la sesión coherente localmente
        this.authService.updateProfile(this.user);
        this.newPassword = '';
        this.confirmPassword = '';
        this.mostrarCambioPassword = false;

        Swal.fire({
          icon: 'success',
          title: '¡Perfil Guardado!',
          text: 'Tus datos de usuario y foto de perfil han sido actualizados.',
          timer: 2000,
          showConfirmButton: false
        });
        this.cdr.detectChanges();
      }
    });
  }

  confirmarEliminarCuenta() {
    Swal.fire({
      title: '¿Eliminar tu cuenta?',
      text: 'Esta acción es irreversible. Se eliminará tu acceso a la plataforma.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar mi cuenta',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarCuenta();
      }
    });
  }

  private eliminarCuenta() {
    const userId = this.user.id || 1;
    this.cargandoEliminar = true;

    this.atmoraService.eliminarUsuario(userId).subscribe({
      next: () => {
        this.cargandoEliminar = false;
        this.authService.logout();
        Swal.fire({
          icon: 'info',
          title: 'Cuenta Eliminada',
          text: 'Tu usuario ha sido removido del sistema.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/auth/login']);
        });
      },
      error: (err: any) => {
        this.cargandoEliminar = false;
        console.error('Error al eliminar en backend:', err);
        this.authService.logout();
        Swal.fire({
          icon: 'info',
          title: 'Sesión Finalizada',
          text: 'Tu usuario ha sido desconectado.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/auth/login']);
        });
      }
    });
  }

  goBack() {
    this.location.back();
  }
}