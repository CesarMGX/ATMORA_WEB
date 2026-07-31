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

  // Variables de Inteligencia Artificial en tiempo real
  cargandoClasificacionClima = false;
  entornoClimaGrupo: number | null = null;
  entornoClimaTexto: string = 'Calculando...';

  cargandoValidacionTemp = false;
  temperaturaValidadaIA: number | null = null;

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
    this.entornoClimaGrupo = null;
    this.entornoClimaTexto = 'Calculando...';
    this.temperaturaValidadaIA = null;

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
        this.ejecutarClasificacionEntorno(); // Ejecutar K-Means con la última lectura del dispositivo
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoHistorial = false;
        console.error('Error al cargar historial del dispositivo:', err);
        this.cdr.detectChanges();
      }
    });
  }

  // ─── LÓGICA DE INTELIGENCIA ARTIFICIAL EN TIEMPO REAL ─────────────────────
  ejecutarClasificacionEntorno(): void {
    const lectura = this.historialLecturas.length > 0 ? this.historialLecturas[0] : {};
    
    const payload = {
      humedad: Number(lectura.humedad ?? 65.0),
      presion: Number(lectura.presion ?? 1013.25),
      radiacion: Number(lectura.radiacion_solar ?? lectura.radiacion ?? 0.0)
    };

    this.cargandoClasificacionClima = true;
    this.entornoClimaTexto = 'Calculando...';
    this.cdr.detectChanges();

    this.atmoraService.clasificarEntornoSensores(payload).subscribe({
      next: (res: any) => {
        this.cargandoClasificacionClima = false;
        if (res && res.grupo !== undefined) {
          this.entornoClimaGrupo = Number(res.grupo);
          if (this.entornoClimaGrupo === 0) {
            this.entornoClimaTexto = 'Templado';
          } else if (this.entornoClimaGrupo === 1) {
            this.entornoClimaTexto = 'Húmedo';
          } else if (this.entornoClimaGrupo === 2) {
            this.entornoClimaTexto = 'Caluroso';
          } else {
            this.entornoClimaTexto = `Grupo ${this.entornoClimaGrupo}`;
          }
        } else {
          this.entornoClimaTexto = 'Sin datos';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoClasificacionClima = false;
        this.entornoClimaTexto = 'No disponible';
        console.error('Error al clasificar entorno IA:', err);
        this.cdr.detectChanges();
      }
    });
  }

  ejecutarValidacionTemperatura(): void {
    const lectura = this.historialLecturas.length > 0 ? this.historialLecturas[0] : {};

    const payload = {
      humedad: Number(lectura.humedad ?? 65.0),
      presion: Number(lectura.presion ?? 1013.25),
      radiacion: Number(lectura.radiacion_solar ?? lectura.radiacion ?? 0.0)
    };

    this.cargandoValidacionTemp = true;
    this.cdr.detectChanges();

    this.atmoraService.validarTemperaturaSensores(payload).subscribe({
      next: (res: any) => {
        this.cargandoValidacionTemp = false;
        if (res && res.temperatura_predicha !== undefined) {
          this.temperaturaValidadaIA = Number(res.temperatura_predicha);
        } else if (res && res.resultado !== undefined) {
          this.temperaturaValidadaIA = Number(res.resultado);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoValidacionTemp = false;
        console.error('Error al validar temperatura IA:', err);
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

  onSearch(): void {
    this.currentPage = 1;
    this.actualizarPaginacion();
  }

  getBadgeEstadoClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e === 'activo') return 'badge-activo';
    if (e === 'mantenimiento') return 'badge-mantenimiento';
    if (e === 'falla') return 'badge-falla';
    return 'badge-inactivo';
  }

  private procesarYRenderizarGraficas(data: any[]): void {
    const ordenados = [...data].reverse();

    const timeLabels: string[] = [];
    const tempSeries: number[] = [];
    const humSeries: number[] = [];
    const rainSeries: number[] = [];
    const radSeries: number[] = [];
    const co2Series: number[] = [];
    const coSeries: number[] = [];
    const pressSeries: number[] = [];

    ordenados.forEach((item, index) => {
      let label = '';
      const fStr = item.fecha_hora || item.fecha_registro;
      if (fStr) {
        const d = new Date(fStr);
        if (!isNaN(d.getTime())) {
          const dia = d.getDate();
          const mes = d.getMonth() + 1;
          const hora = d.getHours().toString().padStart(2, '0');
          const min = d.getMinutes().toString().padStart(2, '0');
          label = `${dia}/${mes} ${hora}:${min}`;
        }
      }
      if (!label) {
        label = `Reg #${ordenados.length - index}`;
      }

      timeLabels.push(label);
      tempSeries.push(Number((item.temperatura ?? 0).toFixed(1)));
      humSeries.push(Number((item.humedad ?? 0).toFixed(1)));
      rainSeries.push(Number((item.precipitacion ?? item.lluvia ?? 0).toFixed(2)));
      radSeries.push(Number((item.radiacion_solar ?? item.radiacion ?? 0).toFixed(1)));
      co2Series.push(Number((item.co2 ?? 410.0).toFixed(1)));
      coSeries.push(Number((item.co ?? 0.45).toFixed(2)));
      pressSeries.push(Number((item.presion ?? 1013.25).toFixed(1)));
    });

    setTimeout(() => {
      this.renderCharts(timeLabels, tempSeries, humSeries, rainSeries, radSeries, co2Series, coSeries, pressSeries);
    }, 150);
  }

  private renderCharts(
    labels: string[],
    temp: number[],
    hum: number[],
    rain: number[],
    rad: number[],
    co2: number[],
    co: number[],
    press: number[]
  ): void {
    // 1. Gráfica Temperatura y Humedad
    const tempHumElement = document.getElementById('chart-temp-hum');
    if (tempHumElement) {
      Highcharts.chart(tempHumElement, {
        chart: { type: 'line', backgroundColor: 'transparent' },
        title: { text: 'Temperatura vs Humedad', style: { fontSize: '15px', fontWeight: 'bold', color: '#0f3460' } },
        xAxis: { categories: labels, labels: { style: { fontSize: '10px' } } },
        yAxis: [
          { title: { text: 'Temperatura (°C)' } },
          { title: { text: 'Humedad (%)' }, opposite: true }
        ],
        series: [
          { name: 'Temperatura (°C)', data: temp, color: '#f77f00', type: 'line', marker: { symbol: 'circle' } },
          { name: 'Humedad (%)', data: hum, color: '#0f3460', yAxis: 1, type: 'line', marker: { symbol: 'diamond' } }
        ],
        credits: { enabled: false }
      });
    }

    // 2. Gráfica Precipitaciones y Radiación Solar
    const rainRadElement = document.getElementById('chart-rain-rad');
    if (rainRadElement) {
      Highcharts.chart(rainRadElement, {
        chart: { backgroundColor: 'transparent' },
        title: { text: 'Precipitación y Radiación Solar', style: { fontSize: '15px', fontWeight: 'bold', color: '#0f3460' } },
        xAxis: { categories: labels, labels: { style: { fontSize: '10px' } } },
        yAxis: [
          { title: { text: 'Precipitación (mm)' } },
          { title: { text: 'Radiación (W/m²)' }, opposite: true }
        ],
        series: [
          { name: 'Precipitación (mm)', data: rain, color: '#38bdf8', type: 'column' },
          { name: 'Radiación (W/m²)', data: rad, color: '#eab308', yAxis: 1, type: 'line', marker: { symbol: 'circle' } }
        ],
        credits: { enabled: false }
      });
    }

    // 3. Gráfica Gases y Calidad de Aire (CO2 / CO) - Columna 3
    const co2CoElement = document.getElementById('chart-co2-co');
    if (co2CoElement) {
      Highcharts.chart(co2CoElement, {
        chart: { type: 'line', backgroundColor: 'transparent' },
        title: { text: 'Gases Ambientales (CO₂ / CO)', style: { fontSize: '15px', fontWeight: 'bold', color: '#0f3460' } },
        xAxis: { categories: labels, labels: { style: { fontSize: '10px' } } },
        yAxis: [
          { title: { text: 'CO₂ (ppm)' } },
          { title: { text: 'CO (ppm)' }, opposite: true }
        ],
        series: [
          { name: 'CO₂ (ppm)', data: co2, color: '#10b981', type: 'line', marker: { symbol: 'circle' } },
          { name: 'CO (ppm)', data: co, color: '#f43f5e', yAxis: 1, type: 'line', marker: { symbol: 'square' } }
        ],
        credits: { enabled: false }
      });
    }

    // 4. Gráfica Presión Atmosférica - Ancho Completo (Imagen 2)
    const pressElement = document.getElementById('chart-pressure');
    if (pressElement) {
      Highcharts.chart(pressElement, {
        chart: { type: 'line', backgroundColor: 'transparent' },
        title: { text: 'Presión Atmosférica', style: { fontSize: '18px', fontWeight: 'bold', color: '#0f3460' } },
        xAxis: {
          categories: labels,
          labels: {
            rotation: -45,
            style: { fontSize: '10px', color: '#475569' }
          }
        },
        yAxis: {
          title: { text: 'hPa', style: { color: '#64748b' } }
        },
        series: [
          {
            name: 'Presión',
            data: press,
            color: '#8b5cf6',
            lineWidth: 2,
            type: 'line',
            marker: { symbol: 'diamond', radius: 4 }
          }
        ],
        credits: { enabled: false }
      });
    }
  }
}
