import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as Highcharts from 'highcharts';
import { AtmoraService } from '../../../../core/services/atmora.service';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitor.html',
  styleUrl: './monitor.scss',
})
export class Monitor implements OnInit {
  dispositivos: any[] = [];
  dispositivoSeleccionado: any | null = null;
  
  historialLecturas: any[] = [];
  historialPaginado: any[] = [];
  
  cargandoDispositivos = false;
  cargandoHistorial = false;
  
  // Paginación de la tabla
  currentPage = 1;
  itemsPerPage = 8;
  totalPages = 1;
  
  searchTerm = '';

  constructor(
    private atmoraService: AtmoraService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDispositivos();
  }

  cargarDispositivos(): void {
    this.cargandoDispositivos = true;
    this.atmoraService.obtenerDispositivos().subscribe({
      next: (response: any) => {
        this.cargandoDispositivos = false;
        const lista = response.status === 'success' ? response.data : response;
        this.dispositivos = Array.isArray(lista) ? lista : [];

        // Comprobar si viene un ID por Query Parameter (ej: /admin/monitor?id=2)
        this.route.queryParams.subscribe(params => {
          const targetId = params['id'] ? Number(params['id']) : null;
          if (targetId) {
            const encontrado = this.dispositivos.find(d => (d.id_dispositivo || d.id) === targetId);
            if (encontrado) {
              this.seleccionarDispositivo(encontrado);
              return;
            }
          }
          // Por defecto seleccionar el primer dispositivo disponible
          if (this.dispositivos.length > 0) {
            this.seleccionarDispositivo(this.dispositivos[0]);
          }
        });

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoDispositivos = false;
        console.error('Error al cargar lista de dispositivos:', err);
      }
    });
  }

  seleccionarDispositivo(dispositivo: any): void {
    this.dispositivoSeleccionado = dispositivo;
    const deviceId = dispositivo.id_dispositivo || dispositivo.id;
    if (deviceId) {
      this.cargarHistorialDispositivo(deviceId);
    }
  }

  cargarHistorialDispositivo(dispositivoId: number): void {
    this.cargandoHistorial = true;
    this.historialLecturas = [];
    this.historialPaginado = [];
    this.cdr.detectChanges();

    this.atmoraService.obtenerHistorialPorDispositivo(dispositivoId, 1, 200).subscribe({
      next: (response: any) => {
        this.cargandoHistorial = false;
        let data = [];
        if (response.status === 'success' && Array.isArray(response.data)) {
          data = response.data;
        } else if (Array.isArray(response)) {
          data = response;
        }
        
        this.historialLecturas = data;
        this.actualizarPaginacion();
        this.procesarYRenderizarGraficas(data);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoHistorial = false;
        console.error('Error al cargar historial del dispositivo:', err);
        this.cdr.detectChanges();
      }
    });
  }

  get historialFiltrado(): any[] {
    if (!this.searchTerm.trim()) {
      return this.historialLecturas;
    }
    const term = this.searchTerm.toLowerCase();
    return this.historialLecturas.filter(row => {
      const fecha = (row.fecha_hora || row.fecha_registro || '').toLowerCase();
      const temp = (row.temperatura ?? '').toString();
      const hum = (row.humedad ?? '').toString();
      return fecha.includes(term) || temp.includes(term) || hum.includes(term);
    });
  }

  actualizarPaginacion(): void {
    const filtrados = this.historialFiltrado;
    this.totalPages = Math.ceil(filtrados.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.historialPaginado = filtrados.slice(start, start + this.itemsPerPage);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages) {
      this.currentPage = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  procesarYRenderizarGraficas(data: any[]): void {
    if (!data || data.length === 0) {
      return;
    }

    // Ordenar cronológicamente ascendente para las gráficas (los registros más antiguos primero)
    const ordenados = [...data].sort((a, b) => {
      const fA = new Date(a.fecha_hora || a.fecha_registro).getTime();
      const fB = new Date(b.fecha_hora || b.fecha_registro).getTime();
      return fA - fB;
    });

    const timeLabels: string[] = [];
    const tempSeries: number[] = [];
    const humSeries: number[] = [];
    const rainSeries: number[] = [];
    const radSeries: number[] = [];
    const pressSeries: number[] = [];

    ordenados.forEach((item) => {
      const dateObj = new Date(item.fecha_hora || item.fecha_registro);
      const label = isNaN(dateObj.getTime())
        ? 'N/A'
        : `${dateObj.getDate()}/${dateObj.getMonth() + 1} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

      timeLabels.push(label);
      tempSeries.push(Number((item.temperatura ?? 0).toFixed(1)));
      humSeries.push(Number((item.humedad ?? 0).toFixed(1)));
      rainSeries.push(Number((item.precipitacion ?? item.lluvia ?? 0).toFixed(2)));
      radSeries.push(Number((item.radiacion_solar ?? item.radiacion ?? 0).toFixed(1)));
      pressSeries.push(Number((item.presion ?? 1013.25).toFixed(1)));
    });

    setTimeout(() => {
      this.renderCharts(timeLabels, tempSeries, humSeries, rainSeries, radSeries, pressSeries);
    }, 150);
  }

  private renderCharts(
    labels: string[],
    temp: number[],
    hum: number[],
    rain: number[],
    rad: number[],
    press: number[]
  ): void {
    // 1. Gráfica Temperatura y Humedad
    const tempHumElement = document.getElementById('chart-temp-hum');
    if (tempHumElement) {
      Highcharts.chart('chart-temp-hum', {
        chart: { type: 'spline', backgroundColor: 'transparent' },
        title: { text: 'Temperatura (°C) y Humedad (%)', style: { color: '#0f3460', fontWeight: '700' } },
        xAxis: { categories: labels, crosshair: true },
        yAxis: [
          { title: { text: 'Temp (°C)', style: { color: '#e74c3c' } }, labels: { format: '{value} °C' } },
          { title: { text: 'Humedad (%)', style: { color: '#3498db' } }, labels: { format: '{value} %' }, opposite: true }
        ],
        tooltip: { shared: true },
        series: [
          { name: 'Temperatura', data: temp, color: '#e74c3c', yAxis: 0, tooltip: { valueSuffix: ' °C' } },
          { name: 'Humedad', data: hum, color: '#3498db', yAxis: 1, tooltip: { valueSuffix: ' %' } }
        ] as any,
        credits: { enabled: false }
      });
    }

    // 2. Gráfica Lluvia y Radiación Solar
    const rainRadElement = document.getElementById('chart-rain-rad');
    if (rainRadElement) {
      Highcharts.chart('chart-rain-rad', {
        chart: { backgroundColor: 'transparent' },
        title: { text: 'Precipitación (mm) y Radiación Solar (W/m²)', style: { color: '#0f3460', fontWeight: '700' } },
        xAxis: { categories: labels, crosshair: true },
        yAxis: [
          { title: { text: 'Lluvia (mm)', style: { color: '#2ecc71' } }, labels: { format: '{value} mm' }, min: 0 },
          { title: { text: 'Radiación (W/m²)', style: { color: '#f77f00' } }, labels: { format: '{value} W/m²' }, opposite: true, min: 0 }
        ],
        tooltip: { shared: true },
        series: [
          { name: 'Lluvia', type: 'column', data: rain, color: '#2ecc71', yAxis: 0, tooltip: { valueSuffix: ' mm' } },
          { name: 'Radiación Solar', type: 'area', data: rad, color: '#f77f00', yAxis: 1, opacity: 0.35, tooltip: { valueSuffix: ' W/m²' } }
        ] as any,
        credits: { enabled: false }
      });
    }

    // 3. Gráfica Presión Atmosférica
    const pressureElement = document.getElementById('chart-pressure');
    if (pressureElement) {
      Highcharts.chart('chart-pressure', {
        chart: { type: 'spline', backgroundColor: 'transparent' },
        title: { text: 'Presión Atmosférica (hPa)', style: { color: '#0f3460', fontWeight: '700' } },
        xAxis: { categories: labels, crosshair: true },
        yAxis: { title: { text: 'Presión (hPa)', style: { color: '#9b59b6' } }, labels: { format: '{value} hPa' } },
        tooltip: { valueSuffix: ' hPa' },
        series: [
          { name: 'Presión Atmosférica', data: press, color: '#9b59b6' }
        ] as any,
        credits: { enabled: false }
      });
    }
  }

  getBadgeEstadoClass(estado: string): string {
    switch ((estado || '').toLowerCase()) {
      case 'activo': return 'badge-activo';
      case 'inactivo': return 'badge-inactivo';
      case 'mantenimiento': return 'badge-mantenimiento';
      case 'falla': return 'badge-falla';
      default: return 'badge-activo';
    }
  }
}
