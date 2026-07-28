import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AtmoraService, Ubicacion, Dispositivo } from '../../../../core/services/atmora.service';
import Swal from 'sweetalert2';
import * as L from 'leaflet';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registros.component.html',
  styleUrl: './registros.component.scss'
})
export class RegistrosComponent implements OnInit, AfterViewInit, OnDestroy {
  ubicacionForm!: FormGroup;
  dispositivoForm!: FormGroup;
  
  ubicaciones: any[] = [];
  dispositivos: any[] = [];

  // Ubicación seleccionada para edición
  ubicacionSeleccionada: any = null;

  // Configuración de Mapa con Leaflet (OpenStreetMap)
  private map!: L.Map;
  private marker!: L.Marker;
  private defaultLat = 18.8943;
  private defaultLng = -96.9353;

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
    this.setupCoordinateSync();
  }

  ngAfterViewInit(): void {
    this.initLeafletMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initLeafletMap(): void {
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const initialLat = this.ubicacionForm.get('latitud')?.value || this.defaultLat;
    const initialLng = this.ubicacionForm.get('longitud')?.value || this.defaultLng;

    this.map = L.map('leaflet-map', {
      center: [initialLat, initialLng],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }).addTo(this.map);

    this.marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon
    }).addTo(this.map);

    
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.actualizarCoordenadas(position.lat, position.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.actualizarCoordenadas(lat, lng);
    });

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 250);
  }

  private initForms(): void {
    this.ubicacionForm = this.fb.group({
      nombre_ubicacion: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      latitud: [this.defaultLat, [Validators.required]],
      longitud: [this.defaultLng, [Validators.required]]
    });

    this.dispositivoForm = this.fb.group({
      nombre_dispositivo: ['', [Validators.required, Validators.minLength(3)]],
      estado: ['activo', [Validators.required]],
      id_ubicacion: ['', [Validators.required]]
    });
  }

  private setupCoordinateSync(): void {
    this.ubicacionForm.valueChanges.subscribe(val => {
      if (val.latitud && val.longitud) {
        const lat = parseFloat(val.latitud);
        const lng = parseFloat(val.longitud);
        if (!isNaN(lat) && !isNaN(lng)) {
          if (this.marker && this.map) {
            const currentPos = this.marker.getLatLng();
            if (Math.abs(currentPos.lat - lat) > 0.000001 || Math.abs(currentPos.lng - lng) > 0.000001) {
              this.marker.setLatLng([lat, lng]);
              this.map.panTo([lat, lng]);
            }
          }
        }
      }
    });
  }

  private actualizarCoordenadas(lat: number, lng: number): void {
    const latFormatted = parseFloat(lat.toFixed(6));
    const lngFormatted = parseFloat(lng.toFixed(6));
    
    this.ubicacionForm.patchValue({
      latitud: latFormatted,
      longitud: lngFormatted
    }, { emitEvent: false });

    this.obtenerDireccion(latFormatted, lngFormatted);
    this.cdr.detectChanges();
  }

  private obtenerDireccion(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          const direccion = data.display_name;
          this.ubicacionForm.patchValue({
            descripcion: `Ubicación registrada cerca de: ${direccion}`
          });
          this.cdr.detectChanges();
        }
      })
      .catch(err => console.error('Error al obtener dirección:', err));
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

  // ─── Selección y Edición de Ubicación ─────────────────────────────────────
  seleccionarUbicacionParaEditar(u: any): void {
    this.ubicacionSeleccionada = u;
    const lat = parseFloat(u.latitud) || this.defaultLat;
    const lng = parseFloat(u.longitud) || this.defaultLng;

    this.ubicacionForm.patchValue({
      nombre_ubicacion: u.nombre_ubicacion || u.nombre,
      descripcion: u.descripcion || '',
      latitud: lat,
      longitud: lng
    });

    if (this.marker && this.map) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 15);
    }

    this.cdr.detectChanges();
  }

  cancelarEdicionUbicacion(): void {
    this.ubicacionSeleccionada = null;
    this.ubicacionForm.reset({
      latitud: this.defaultLat,
      longitud: this.defaultLng
    });

    if (this.marker && this.map) {
      this.marker.setLatLng([this.defaultLat, this.defaultLng]);
      this.map.setView([this.defaultLat, this.defaultLng], 13);
    }

    this.cdr.detectChanges();
  }

  onGuardarUbicacion(): void {
    if (this.ubicacionForm.invalid) {
      this.ubicacionForm.markAllAsTouched();
      return;
    }

    if (this.ubicacionSeleccionada) {
      this.onActualizarUbicacion();
    } else {
      this.onRegistrarUbicacion();
    }
  }

  onRegistrarUbicacion(): void {
    const payload: Ubicacion = this.ubicacionForm.value;

    this.atmoraService.crearUbicacion(payload).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Ubicación Registrada',
          text: 'La zona ha sido añadida correctamente.',
          confirmButtonColor: '#f77f00'
        });
        
        this.cancelarEdicionUbicacion();
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

  onActualizarUbicacion(): void {
    const id = this.ubicacionSeleccionada.id_ubicacion || this.ubicacionSeleccionada.id;
    if (!id) return;

    const payload: Ubicacion = this.ubicacionForm.value;

    this.atmoraService.actualizarUbicacion(id, payload).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Ubicación Actualizada',
          text: 'Los datos de la zona han sido modificados correctamente.',
          confirmButtonColor: '#f77f00'
        });

        this.cancelarEdicionUbicacion();
        this.cargarUbicaciones();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error de Actualización',
          text: err.error?.message || 'No se pudo actualizar la ubicación.',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  confirmarEliminarUbicacion(u: any): void {
    const id = u.id_ubicacion || u.id;
    const nombre = u.nombre_ubicacion || u.nombre || 'Ubicación';

    if (!id) return;

    Swal.fire({
      title: '¿Eliminar ubicación?',
      html: `¿Estás seguro de eliminar la zona <strong>"${nombre}"</strong>?<br><small style="color: #64748b;">Esta acción eliminará el registro de la base de datos.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.atmoraService.eliminarUbicacion(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Ubicación Eliminada',
              text: `La ubicación "${nombre}" fue eliminada con éxito.`,
              confirmButtonColor: '#f77f00'
            });

            if (this.ubicacionSeleccionada && (this.ubicacionSeleccionada.id_ubicacion === id || this.ubicacionSeleccionada.id === id)) {
              this.cancelarEdicionUbicacion();
            }
            this.cargarUbicaciones();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error al Eliminar',
              text: err.error?.message || 'No se pudo eliminar la ubicación.',
              confirmButtonColor: '#e74c3c'
            });
          }
        });
      }
    });
  }

  onEliminarUbicacionDirecta(u: any, event: MouseEvent): void {
    event.stopPropagation(); // Evitamos seleccionar la ubicación para editar cuando solo presiona el botón eliminar
    this.confirmarEliminarUbicacion(u);
  }

  onRegistrarDispositivo(): void {
    if (this.dispositivoForm.invalid) {
      this.dispositivoForm.markAllAsTouched();
      return;
    }

    const payload: Dispositivo = {
      ...this.dispositivoForm.value,
      fecha_instalacion: new Date().toISOString().split('T')[0]
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
