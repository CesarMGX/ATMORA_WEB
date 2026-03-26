import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';
import Swal from 'sweetalert2';

interface Usuario {
 id?: number; // El ID ahora es opcional porque json-server lo crea solo al hacer POST
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
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Empezamos con un arreglo vacío, lo llenaremos desde la base de datos
  usuarios: Usuario[] = [];

  isDrawerOpen = false;
  isEditing = false;
  currentUser: any = { nombre: '', correo: '', rol: 'Usuario', estado: 'Activo' };
  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Construimos la URL específica para los usuarios (http://localhost:3003/usuarios)
  private apiUrl = `${environment.apiUrl}/usuarios`;

  // Inyectamos HttpClient y el ChangeDetectorRef para darle el "codazo" a Angular
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  // Al iniciar el componente, cargamos los datos
  ngOnInit() {
    this.cargarUsuarios();
  }

  // --- 1. GET: LEER DATOS ---
  cargarUsuarios() {
    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cdr.detectChanges(); // ¡Codazo! Pinta la tabla al instante
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
    if (user) {
      this.isEditing = true;
      // Al editar, no cargamos la contraseña por seguridad, a menos que la quieran sobrescribir
      this.currentUser = { ...user, password: '' }; 
    } else {
      this.isEditing = false;
      // Reseteamos incluyendo la contraseña vacía
      this.currentUser = { nombre: '', correo: '', password: '', rol: 'Usuario', estado: 'Activo' };
    }
    this.cdr.detectChanges(); 
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.cdr.detectChanges(); // ¡Codazo! Cierra el menú rápido
  }

  // --- 2. POST / PUT: GUARDAR O ACTUALIZAR DATOS ---
  saveUser() {
    // Validamos que tenga nombre, correo, y si es NUEVO, que a fuerzas tenga contraseña
    if (!this.currentUser.nombre || !this.currentUser.correo || (!this.isEditing && !this.currentUser.password)) {
      Swal.fire('¡Ups!', 'Rellena todos los campos obligatorios.', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    this.currentUser.avatar = `https://ui-avatars.com/api/?name=${this.currentUser.nombre.replace(' ', '+')}&background=random&color=fff`;

    // Si estamos editando y dejaron la contraseña en blanco, la eliminamos del objeto para no borrar la que ya tenían en db.json
    if (this.isEditing && !this.currentUser.password) {
      delete this.currentUser.password;
    }

    if (this.isEditing) {
      // PUT: Actualizar un registro existente
      this.http.put(`${this.apiUrl}/${this.currentUser.id}`, this.currentUser).subscribe({
        // ... (deja tu código de next() igual)
        next: () => {
          this.cargarUsuarios(); 
          Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
          this.closeDrawer();
        }
      });
    } else {
      // POST: Crear un nuevo registro
      // Le agregamos un primerIngreso: true para que se comporte como un usuario nuevo
      const newUser = { ...this.currentUser, fechaRegistro: today, primerIngreso: true };
      
      this.http.post(this.apiUrl, newUser).subscribe({
        // ... (deja tu código de next() igual)
        next: () => {
          this.cargarUsuarios(); 
          Swal.fire({ icon: 'success', title: 'Creado', timer: 1500, showConfirmButton: false });
          this.closeDrawer();
        }
      });
    }
  }

  // --- 3. DELETE: BORRAR DATOS ---
  deleteUser(user: Usuario) {
    Swal.fire({
      title: '¿Estás seguro?', text: `Vas a eliminar a ${user.nombre}.`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#e74c3c', confirmButtonText: 'Sí, eliminar'
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