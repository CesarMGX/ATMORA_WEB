import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../../../core/services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class Perfil implements OnInit { // El nombre de la clase coincide con tu routes.ts
  
  user: UserProfile = { id: 0, nombre: '', correo: '', avatar: '', rol: 'Usuario' };
  previewUrl: string | null = null;

  constructor(
    private authService: AuthService, 
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = { ...currentUser }; 
      this.previewUrl = this.user.avatar;
    }
  }

  // Previsualizar la foto antes de guardar
onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result; 
        
        // Obligamos a Angular a refrescar la vista en este milisegundo
        this.cdr.detectChanges(); 
      };
      reader.readAsDataURL(file);
    }
  }

  guardarCambios() {
    if (!this.user.nombre || !this.user.correo) {
      Swal.fire({
        icon: 'error',
        title: '¡Ups!',
        text: 'El nombre y correo son obligatorios.',
        confirmButtonColor: '#0f3460'
      });
      return;
    }

    if (this.previewUrl) {
      this.user.avatar = this.previewUrl;
    }

    this.authService.updateProfile(this.user);
    
    Swal.fire({
      icon: 'success',
      title: '¡Perfil Actualizado!',
      text: 'Tus datos se han guardado correctamente.',
      timer: 2000,
      showConfirmButton: false
    });
  }

  // Regresa a la página anterior dinámicamente
  goBack() {
    this.location.back();
  }
}