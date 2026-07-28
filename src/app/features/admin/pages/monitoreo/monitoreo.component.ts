import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtmoraService } from '../../../../core/services/atmora.service';
import Swal from 'sweetalert2';

interface ModeloPredictivoInfo {
  id: string;
  nombre: string;
  unidad: string;
  icono: string;
  descripcion: string;
}

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
  
  // Modelos predictivos Random Forest
  modelosPredictivos: ModeloPredictivoInfo[] = [
    { id: 'humedad', nombre: 'Humedad (%)', unidad: '%', icono: 'bx-water', descripcion: 'Porcentaje de humedad relativa estimada' },
    { id: 'radiacion', nombre: 'Radiación Solar (W/m²)', unidad: 'W/m²', icono: 'bx-sun', descripcion: 'Intensidad de radiación solar estimada' },
    { id: 'viento', nombre: 'Velocidad del Viento (km/h)', unidad: 'km/h', icono: 'bx-wind', descripcion: 'Velocidad estimada del viento' },
    { id: 'presion', nombre: 'Presión Atmosférica (hPa)', unidad: 'hPa', icono: 'bx-tachometer', descripcion: 'Presión atmosférica estimada' }
  ];
  
  modeloSeleccionado: string = 'humedad';
  fechaSeleccionada: string = '';
  minFecha: string = '';
  maxFecha: string = '';

  // Estados de ejecucion
  isLoading: boolean = false;
  resultadoIA: number | null = null;
  errorMsg: string | null = null;

  constructor(
    private atmoraService: AtmoraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDispositivos();
    this.calcularRangoFechas();
  }

  private calcularRangoFechas(): void {
    const hoy = new Date();
    const hoyISO = hoy.toISOString().split('T')[0];
    
    // Exactamente 15 días en el futuro
    const futuro = new Date();
    futuro.setDate(hoy.getDate() + 15);
    const futuroISO = futuro.toISOString().split('T')[0];

    this.minFecha = hoyISO;
    this.maxFecha = futuroISO;
    this.fechaSeleccionada = hoyISO;
  }

  cargarDispositivos(): void {
    this.atmoraService.obtenerDispositivos().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.dispositivos = response.data.filter((d: any) => d.estado === 'activo');
        } else {
          this.dispositivos = response.filter((d: any) => d.estado === 'activo');
        }
        if (this.dispositivos.length > 0 && !this.selectedDispositivoId) {
          this.selectedDispositivoId = this.dispositivos[0].id_dispositivo || this.dispositivos[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar dispositivos:', err);
      }
    });
  }

  get modeloActualInfo(): ModeloPredictivoInfo {
    return this.modelosPredictivos.find(m => m.id === this.modeloSeleccionado) || this.modelosPredictivos[0];
  }

  onParametrosChange(): void {
    // Resetear resultados al cambiar la fecha o el modelo seleccionado
    this.resultadoIA = null;
    this.errorMsg = null;
  }

  ejecutarPruebaIA(): void {
    if (!this.fechaSeleccionada) {
      this.errorMsg = 'Por favor selecciona una fecha válida en el rango permitido.';
      return;
    }

    this.isLoading = true;
    this.resultadoIA = null;
    this.errorMsg = null;
    this.cdr.detectChanges();

    this.atmoraService.predecirPorFecha(this.modeloSeleccionado, this.fechaSeleccionada).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && typeof response.resultado === 'number') {
          this.resultadoIA = response.resultado;
        } else if (response && response.resultado !== undefined) {
          this.resultadoIA = parseFloat(response.resultado);
        } else {
          this.errorMsg = 'Respuesta no válida del servicio de inteligencia artificial.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Error al conectar con la API de predicciones.';
        this.cdr.detectChanges();
        
        Swal.fire({
          icon: 'error',
          title: 'Fallo en la prueba de IA',
          text: this.errorMsg || 'No se pudo obtener el resultado del modelo.',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }
}
