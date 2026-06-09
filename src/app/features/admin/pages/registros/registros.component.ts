import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AtmoraService, Ubicacion, Dispositivo } from '../../../../core/services/atmora.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registros.component.html',
  styleUrl: './registros.component.scss'
})
export class RegistrosComponent implements OnInit {
  ubicacionForm!: FormGroup;
  dispositivoForm!: FormGroup;
  
  ubicaciones: any[] = [];
  dispositivos: any[] = [];

  constructor(
    private fb: FormBuilder,
    private atmoraService: AtmoraService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.cargarUbicaciones();
    this.cargarDispositivos();
  }

  private initForms(): void {
    // Formulario de Ubicación (latitud y longitud son requeridos por la BD en el backend)
    this.ubicacionForm = this.fb.group({
      nombre_ubicacion: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      latitud: [20.6736, [Validators.required]], // Guadalajara por defecto
      longitud: [-103.344, [Validators.required]]
    });

    // Formulario de Dispositivo
    this.dispositivoForm = this.fb.group({
      nombre_dispositivo: ['', [Validators.required, Validators.minLength(3)]],
      estado: ['activo', [Validators.required]],
      id_ubicacion: ['', [Validators.required]]
    });
  }

  cargarUbicaciones(): void {
    this.atmoraService.obtenerUbicaciones().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.ubicaciones = response.data;
        } else {
          this.ubicaciones = response;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ubicaciones:', err);
      }
    });
  }

  cargarDispositivos(): void {
    this.atmoraService.obtenerDispositivos().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.dispositivos = response.data;
        } else {
          this.dispositivos = response;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar dispositivos:', err);
      }
    });
  }

  onRegistrarUbicacion(): void {
    if (this.ubicacionForm.invalid) {
      this.ubicacionForm.markAllAsTouched();
      return;
    }

    const payload: Ubicacion = this.ubicacionForm.value;

    this.atmoraService.crearUbicacion(payload).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Ubicación Registrada',
          text: 'La zona ha sido añadida correctamente.',
          confirmButtonColor: '#f77f00'
        });
        this.ubicacionForm.reset({ latitud: 20.6736, longitud: -103.344 });
        this.cargarUbicaciones();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error de Registro',
          text: err.error?.message || 'No se pudo registrar la ubicación.',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  onRegistrarDispositivo(): void {
    if (this.dispositivoForm.invalid) {
      this.dispositivoForm.markAllAsTouched();
      return;
    }

    const payload: Dispositivo = {
      ...this.dispositivoForm.value,
      fecha_instalacion: new Date().toISOString().split('T')[0] // Fecha de hoy
    };

    this.atmoraService.crearDispositivo(payload).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Dispositivo Registrado',
          text: 'El sensor IoT ha sido asociado con éxito.',
          confirmButtonColor: '#f77f00'
        });
        this.dispositivoForm.reset({ estado: 'activo', id_ubicacion: '' });
        this.cargarDispositivos();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error de Registro',
          text: err.error?.message || 'No se pudo registrar el dispositivo.',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }
}
