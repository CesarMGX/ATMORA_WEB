import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtmoraService } from '../../../../core/services/atmora.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoreo.component.html',
  styleUrl: './monitoreo.component.scss'
})
export class MonitoreoComponent implements OnInit {
  dispositivos: any[] = [];
  selectedDispositivoId: number | null = null;
  
  ultimaLectura: any | null = null;
  cargandoLectura = false;
  
  prediccionCargando = false;
  temperaturaPredicha: number | null = null;

  constructor(
    private atmoraService: AtmoraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDispositivos();
  }

  cargarDispositivos(): void {
    this.atmoraService.obtenerDispositivos().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // Filtrar solo los dispositivos activos para el monitoreo
          this.dispositivos = response.data.filter((d: any) => d.estado === 'activo');
        } else {
          this.dispositivos = response.filter((d: any) => d.estado === 'activo');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar dispositivos:', err);
      }
    });
  }

  onDispositivoChange(): void {
    if (!this.selectedDispositivoId) {
      this.ultimaLectura = null;
      this.temperaturaPredicha = null;
      return;
    }

    this.cargandoLectura = true;
    this.temperaturaPredicha = null; // Resetear predicción anterior
    this.cdr.detectChanges();

    this.atmoraService.obtenerUltimaLectura(this.selectedDispositivoId).subscribe({
      next: (response) => {
        this.cargandoLectura = false;
        if (response.status === 'success') {
          this.ultimaLectura = response.data;
        } else {
          this.ultimaLectura = response;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoLectura = false;
        this.ultimaLectura = null;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'warning',
          title: 'Sin Lecturas Recientes',
          text: err.error?.message || 'Este dispositivo no ha emitido lecturas aún.',
          confirmButtonColor: '#f77f00'
        });
      }
    });
  }

  generarPrediccion(): void {
    if (!this.ultimaLectura) return;

    this.prediccionCargando = true;
    this.cdr.detectChanges();

    const payload = {
      humedad: this.ultimaLectura.humedad,
      presion: this.ultimaLectura.presion || 1013.25, // Presión por defecto si es nula
      radiacion: this.ultimaLectura.radiacion || this.ultimaLectura.radiacion_solar || 0
    };

    this.atmoraService.predecirTemperatura(payload).subscribe({
      next: (response) => {
        this.prediccionCargando = false;
        if (response.status === 'success') {
          this.temperaturaPredicha = response.data.temperatura_predicha;
        } else {
          this.temperaturaPredicha = response.temperatura_predicha;
        }
        this.cdr.detectChanges();
        
        Swal.fire({
          icon: 'success',
          title: 'Predicción Exitosa',
          text: `Temperatura estimada por el Modelo: ${this.temperaturaPredicha?.toFixed(2)} °C`,
          confirmButtonColor: '#f77f00',
          timer: 3000
        });
      },
      error: (err) => {
        this.prediccionCargando = false;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Error de Predicción',
          text: err.error?.message || 'Error al conectar con el servidor de inteligencia artificial.',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }
}
