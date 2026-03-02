import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'Admin' | 'Usuario';
  estado: 'Activo' | 'Inactivo';
  avatar: string;
}

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {

  // Base de datos simulada
  usuarios: Usuario[] = [
    { id: 1, nombre: 'Cesar Mundo', correo: 'cesar@atmora.com', rol: 'Admin', estado: 'Activo', avatar: 'https://ui-avatars.com/api/?name=Cesar+Mundo&background=0f3460&color=fff' },
    { id: 2, nombre: 'Alex Tadeo', correo: 'alex@atmora.com', rol: 'Usuario', estado: 'Activo', avatar: 'https://ui-avatars.com/api/?name=Alex+Tadeo&background=f77f00&color=fff' },
    { id: 3, nombre: 'Ricardo Castro', correo: 'profe@atmora.com', rol: 'Admin', estado: 'Inactivo', avatar: 'https://ui-avatars.com/api/?name=Ricardo+Castro&background=2ecc71&color=fff' },
  ];

  // Control del Modal
  showModal = false;
  isEditing = false;
  
  // Usuario temporal para el formulario
  currentUser: any = { nombre: '', correo: '', rol: 'Usuario', estado: 'Activo' };

  // --- ABRIR MODAL
  openModal(user: Usuario | null = null) {
    this.showModal = true;
    if (user) {
      // MODO EDICIÓN: Copiamos los datos del usuario seleccionado
      this.isEditing = true;
      this.currentUser = { ...user }; // Clonamos el objeto para no editar en tiempo real
    } else {
      // MODO CREAR: Limpiamos el formulario
      this.isEditing = false;
      this.currentUser = { nombre: '', correo: '', rol: 'Usuario', estado: 'Activo' };
    }
  }

  closeModal() {
    this.showModal = false;
  }

  // --- GUARDAR (CREAR O ACTUALIZAR) ---
  saveUser() {
    // 1. Validación simple
    if (!this.currentUser.nombre || !this.currentUser.correo) {
      // ANIMACIÓN DE ERROR
      Swal.fire({
        icon: 'error',
        title: '¡Ups!',
        text: 'Por favor rellena todos los campos obligatorios.',
        confirmButtonColor: '#0f3460'
      });
      return;
    }

    if (this.isEditing) {
      // ACTUALIZAR
      const index = this.usuarios.findIndex(u => u.id === this.currentUser.id);
      if (index !== -1) {
        this.currentUser.avatar = `https://ui-avatars.com/api/?name=${this.currentUser.nombre}&background=random`;
        this.usuarios[index] = this.currentUser;
        
        // ANIMACIÓN DE ÉXITO
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'El usuario ha sido modificado correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } else {
      // CREAR
      const newId = this.usuarios.length + 1;
      const newUser: Usuario = {
        ...this.currentUser,
        id: newId,
        avatar: `https://ui-avatars.com/api/?name=${this.currentUser.nombre}&background=random`
      };
      this.usuarios.push(newUser);

      // ANIMACIÓN DE ÉXITO
      Swal.fire({
        icon: 'success',
        title: 'Creado',
        text: 'El nuevo usuario ha sido registrado.',
        timer: 2000,
        showConfirmButton: false
      });
    }

    this.closeModal();
  }

  // --- ELIMINAR ---
  deleteUser(user: Usuario) {
    // ANIMACIÓN DE CONFIRMACIÓN
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar a ${user.nombre}. Esto no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Borrar de la lista
        this.usuarios = this.usuarios.filter(u => u.id !== user.id);
        
        Swal.fire(
          '¡Eliminado!',
          'El usuario ha sido borrado.',
          'success'
        );
      }
    });
  }
}
