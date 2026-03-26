import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Chart from 'chart.js/auto';
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})

export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('registrosChart') chartCanvas!: ElementRef;
  @ViewChild('rolesChart') rolesChartCanvas!: ElementRef;
  
  chart: any;
  rolesChart: any;

  // Variables para las tarjetas
  totalUsuarios = 0;
  usuariosActivos = 0;
  totalAdmins = 0;
  nuevosEsteMes = 0;

  // Variable para la tabla
  usuariosRecientes: any[] = []; 

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  ngAfterViewInit() {}

  cargarEstadisticas() {
    this.http.get<any[]>(`${environment.apiUrl}/usuarios`).subscribe({
      next: (usuarios) => {
        this.calcularMetricas(usuarios);
        this.generarGraficaMeses(usuarios);
        this.generarGraficaRoles(usuarios); // Llamamos a la nueva gráfica
        this.obtenerUsuariosRecientes(usuarios); // Llamamos a la tabla
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar datos del dashboard', err)
    });
  }

  calcularMetricas(usuarios: any[]) {
    this.totalUsuarios = usuarios.length;
    this.usuariosActivos = usuarios.filter(u => u.estado === 'Activo').length;
    this.totalAdmins = usuarios.filter(u => u.rol === 'Admin').length;

    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();
    
    this.nuevosEsteMes = usuarios.filter(u => {
      if (!u.fechaRegistro) return false;
      const fecha = new Date(u.fechaRegistro);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    }).length;
  }

  generarGraficaMeses(usuarios: any[]) {
    const conteoPorMes: { [key: string]: number } = {
      'Enero': 0, 'Febrero': 0, 'Marzo': 0, 'Abril': 0, 'Mayo': 0, 'Junio': 0,
      'Julio': 0, 'Agosto': 0, 'Septiembre': 0, 'Octubre': 0, 'Noviembre': 0, 'Diciembre': 0
    };

    const nombresMeses = Object.keys(conteoPorMes);

    usuarios.forEach(u => {
      if (u.fechaRegistro) {
        const mesString = u.fechaRegistro.split('-')[1]; 
        const mesIndex = parseInt(mesString, 10) - 1;
        if (mesIndex >= 0 && mesIndex <= 11) {
          conteoPorMes[nombresMeses[mesIndex]]++;
        }
      }
    });

    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(conteoPorMes),
        datasets: [{
          label: 'Usuarios Registrados',
          data: Object.values(conteoPorMes),
          backgroundColor: '#f77f00',
          borderRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // GRÁFICA DE DONA
  generarGraficaRoles(usuarios: any[]) {
    const admins = usuarios.filter(u => u.rol === 'Admin').length;
    const normales = usuarios.filter(u => u.rol !== 'Admin').length;

    if (this.rolesChart) this.rolesChart.destroy();

    const ctx = this.rolesChartCanvas.nativeElement.getContext('2d');
    this.rolesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Administradores', 'Usuarios'],
        datasets: [{
          data: [admins, normales],
          backgroundColor: ['#0f3460', '#4285F4'], // Azul oscuro (Admin) y Azul claro (User)
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // TABLA RECIENTES
  obtenerUsuariosRecientes(usuarios: any[]) {
    // Ordenamos todo el arreglo por fecha, del más nuevo al más viejo
    const ordenados = [...usuarios].sort((a, b) => {
      const fechaA = new Date(a.fechaRegistro || 0).getTime();
      const fechaB = new Date(b.fechaRegistro || 0).getTime();
      return fechaB - fechaA; // Mayor a menor
    });

    // Cortamos solo los primeros 5 para no saturar el dashboard
    this.usuariosRecientes = ordenados.slice(0, 5);
  }
}