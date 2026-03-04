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
  fechaRegistro: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {

  searchTerm: string = '';
  
  // --- VARIABLES DE PAGINACIÓN ---
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Base de datos simulada (Agregué más para que veas la paginación funcionar)
  usuarios: Usuario[] = [
    { id: 1, nombre: 'Cesar Mundo', correo: 'cesar@atmora.com', rol: 'Admin', estado: 'Activo', fechaRegistro: '2025-08-10', avatar: 'https://ui-avatars.com/api/?name=Cesar+Mundo&background=0f3460&color=fff' },
    { id: 2, nombre: 'Alex Tadeo', correo: 'alex@atmora.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2025-09-15', avatar: 'https://ui-avatars.com/api/?name=Alex+Tadeo&background=f77f00&color=fff' },
    { id: 3, nombre: 'Ana López', correo: 'ana@atmora.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2026-02-01', avatar: 'https://ui-avatars.com/api/?name=Ana+Lopez&background=random&color=fff' },
    { id: 4, nombre: 'Carlos Ruiz', correo: 'carlos@atmora.com', rol: 'Usuario', estado: 'Inactivo', fechaRegistro: '2026-02-05', avatar: 'https://ui-avatars.com/api/?name=Carlos+Ruiz&background=random&color=fff' },
    { id: 5, nombre: 'María Gil', correo: 'maria@atmora.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2026-02-10', avatar: 'https://ui-avatars.com/api/?name=Maria+Gil&background=random&color=fff' },
    { id: 6, nombre: 'Jorge Sosa', correo: 'jorge@atmora.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2026-02-12', avatar: 'https://ui-avatars.com/api/?name=Jorge+Sosa&background=random&color=fff' },
    { id: 7, nombre: 'Luis Vega', correo: 'luis@atmora.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2026-02-15', avatar: 'https://ui-avatars.com/api/?name=Luis+Vega&background=random&color=fff' },
    { id: 8, nombre: 'Diana Paz', correo: 'diana@atmora.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2026-02-18', avatar: 'https://ui-avatars.com/api/?name=Diana+Paz&background=random&color=fff' },
    { id: 9, nombre: 'Pedro Diaz', correo: 'pedro@atmora.com', rol: 'Admin', estado: 'Activo', fechaRegistro: '2026-02-20', avatar: 'https://ui-avatars.com/api/?name=Pedro+Diaz&background=random&color=fff' },
    { id: 10, nombre: 'Sofía Lara', correo: 'sofia@atmora.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2026-02-25', avatar: 'https://ui-avatars.com/api/?name=Sofia+Lara&background=random&color=fff' },
    { id: 11, nombre: 'Hugo Alba', correo: 'hugo@atmora.com', rol: 'Usuario', estado: 'Inactivo', fechaRegistro: '2026-03-01', avatar: 'https://ui-avatars.com/api/?name=Hugo+Alba&background=random&color=fff' }
  ];

  isDrawerOpen = false;
  isEditing = false;
  currentUser: any = { nombre: '', correo: '', rol: 'Usuario', estado: 'Activo' };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  
  // 1. Obtiene los usuarios que coinciden con la búsqueda
  get usuariosFiltrados() {
    if (!this.searchTerm) return this.usuarios;
    const term = this.searchTerm.toLowerCase();
    return this.usuarios.filter(u => 
      u.nombre.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      u.rol.toLowerCase().includes(term)
    );
  }

  // 2. Calcula el total de páginas
  get totalPages() {
    return Math.ceil(this.usuariosFiltrados.length / this.itemsPerPage) || 1;
  }

  // 3. Corta el arreglo para mostrar solo los 10 de la página actual
  get usuariosPaginados() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.usuariosFiltrados.slice(startIndex, endIndex);
  }

  // Resetear la página al buscar
  onSearch() {
    this.currentPage = 1;
  }

  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // --- MÉTODOS DEL DRAWER ---
  openDrawer(user: Usuario | null = null) {
    this.isDrawerOpen = true;
    if (user) {
      this.isEditing = true;
      this.currentUser = { ...user };
    } else {
      this.isEditing = false;
      this.currentUser = { nombre: '', correo: '', rol: 'Usuario', estado: 'Activo' };
    }
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  saveUser() {
    if (!this.currentUser.nombre || !this.currentUser.correo) {
      Swal.fire('¡Ups!', 'Rellena todos los campos.', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (this.isEditing) {
      const index = this.usuarios.findIndex(u => u.id === this.currentUser.id);
      if (index !== -1) {
        this.currentUser.avatar = `https://ui-avatars.com/api/?name=${this.currentUser.nombre}&background=random`;
        this.usuarios[index] = this.currentUser;
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Modificado correctamente.', timer: 2000, showConfirmButton: false });
      }
    } else {
      const newId = this.usuarios.length ? Math.max(...this.usuarios.map(u => u.id)) + 1 : 1;
      const newUser: Usuario = {
        ...this.currentUser, id: newId, fechaRegistro: today,
        avatar: `https://ui-avatars.com/api/?name=${this.currentUser.nombre}&background=random`
      };
      this.usuarios.push(newUser);
      Swal.fire({ icon: 'success', title: 'Creado', text: 'Usuario registrado.', timer: 2000, showConfirmButton: false });
    }
    this.closeDrawer();
  }

  deleteUser(user: Usuario) {
    Swal.fire({
      title: '¿Estás seguro?', text: `Vas a eliminar a ${user.nombre}.`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#e74c3c', confirmButtonText: 'Eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarios = this.usuarios.filter(u => u.id !== user.id);
        
        // Si borramos el último usuario de una página, regresamos a la anterior
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }

        Swal.fire('¡Eliminado!', 'El usuario ha sido borrado.', 'success');
      }
    });
  }
}