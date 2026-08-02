import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AtmoraService } from '../../../../core/services/atmora.service';
import Swal from 'sweetalert2';

interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  password?: string;
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
export class Usuarios implements OnInit {

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;

  usuarios: Usuario[] = [];

  isDrawerOpen = false;
  isEditing = false;
  currentUser: any = { nombre: '', correo: '', rol: 'Usuario', estado: 'Activo', avatar: '' };
  showPassword = false;

  // Foto de perfil para el Drawer modal
  drawerPreviewUrl: string = '';
  drawerSelectedFile: File | null = null;
  cargandoGuardar: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(
    private http: HttpClient,
    private atmoraService: AtmoraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  // Generar URL de Avatar segura (foto de Cloudinary o UI-Avatars como fallback)
  getAvatarUrl(user: any): string {
    if (user && user.avatar && typeof user.avatar === 'string' && user.avatar.trim().length > 0) {
      return user.avatar.trim();
    }
    const name = user && user.nombre ? encodeURIComponent(user.nombre) : 'Usuario';
    return `https://ui-avatars.com/api/?name=${name}&background=0f3460&color=fff&bold=true`;
  }

  // --- 1. GET: LEER DATOS ---
  cargarUsuarios() {
    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios', err);
        Swal.fire('Error', 'No se pudo conectar a la base de datos.', 'error');
      }
    });
  }

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  get usuariosFiltrados() {
    if (!this.searchTerm) return this.usuarios;
    const term = this.searchTerm.toLowerCase();
    return this.usuarios.filter(u => 
      u.nombre.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      u.rol.toLowerCase().includes(term)
    );
  }

  get totalPages() {
    return Math.ceil(this.usuariosFiltrados.length / this.itemsPerPage) || 1;
  }

  get usuariosPaginados() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.usuariosFiltrados.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onSearch() { this.currentPage = 1; }
  
  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  // --- MÉTODOS DEL DRAWER ---
  openDrawer(user: Usuario | null = null) {
    this.isDrawerOpen = true;
    this.showPassword = false;
    this.drawerSelectedFile = null;

    if (user) {
      this.isEditing = true;
      this.currentUser = { ...user, password: '' };
      this.drawerPreviewUrl = this.getAvatarUrl(user);
    } else {
      this.isEditing = false;
      this.currentUser = { nombre: '', correo: '', password: '', rol: 'Usuario', estado: 'Activo', avatar: '' };
      this.drawerPreviewUrl = this.getAvatarUrl({ nombre: 'Nuevo Usuario' });
    }
    this.cdr.detectChanges();
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.drawerSelectedFile = null;
    this.cdr.detectChanges();
  }

  // Manejar selección de foto en el modal lateral
  onDrawerFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Archivo pesado', 'La foto seleccionada supera los 5MB permitidos.', 'warning');
        return;
      }
      this.drawerSelectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.drawerPreviewUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  // --- 2. POST / PUT: GUARDAR O ACTUALIZAR DATOS CON CLOUDINARY ---
  saveUser() {
    if (!this.currentUser.nombre || !this.currentUser.correo || (!this.isEditing && !this.currentUser.password)) {
      Swal.fire('¡Ups!', 'Rellena todos los campos obligatorios.', 'error');
      return;
    }

    this.cargandoGuardar = true;

    // Si el administrador seleccionó una nueva foto de perfil para el usuario
    if (this.drawerSelectedFile) {
      this.atmoraService.subirFotoPerfil(this.drawerSelectedFile).subscribe({
        next: (res: any) => {
          const cloudinaryUrl = res.secure_url || res.url;
          if (cloudinaryUrl) {
            this.currentUser.avatar = cloudinaryUrl;
          }
          this.drawerSelectedFile = null;
          this.ejecutarGuardadoBackend();
        },
        error: (err: any) => {
          console.error('Error al subir imagen a Cloudinary en Usuarios:', err);
          this.ejecutarGuardadoBackend();
        }
      });
    } else {
      this.ejecutarGuardadoBackend();
    }
  }

  private ejecutarGuardadoBackend() {
    const today = new Date().toISOString().split('T')[0];

    if (!this.currentUser.avatar) {
      this.currentUser.avatar = this.getAvatarUrl(this.currentUser);
    }

    if (this.isEditing && !this.currentUser.password) {
      delete this.currentUser.password;
    }

    if (this.isEditing) {
      this.http.put(`${this.apiUrl}/${this.currentUser.id}`, this.currentUser).subscribe({
        next: () => {
          this.cargandoGuardar = false;
          this.cargarUsuarios(); 
          Swal.fire({ icon: 'success', title: 'Usuario Actualizado', timer: 1500, showConfirmButton: false });
          this.closeDrawer();
        },
        error: (err) => {
          this.cargandoGuardar = false;
          console.error('Error al actualizar usuario:', err);
          Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
        }
      });
    } else {
      const newUser = { ...this.currentUser, fechaRegistro: today, primerIngreso: true };
      
      this.http.post(this.apiUrl, newUser).subscribe({
        next: () => {
          this.cargandoGuardar = false;
          this.cargarUsuarios(); 
          Swal.fire({ icon: 'success', title: 'Usuario Creado', timer: 1500, showConfirmButton: false });
          this.closeDrawer();
        },
        error: (err) => {
          this.cargandoGuardar = false;
          console.error('Error al crear usuario:', err);
          Swal.fire('Error', 'No se pudo crear el usuario.', 'error');
        }
      });
    }
  }

  // --- 3. DELETE: BORRAR DATOS ---
  deleteUser(user: Usuario) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar a ${user.nombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${user.id}`).subscribe({
          next: () => {
            this.cargarUsuarios(); 
            if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
            Swal.fire('¡Eliminado!', 'El usuario ha sido borrado.', 'success');
          }
        });
      }
    });
  }
}