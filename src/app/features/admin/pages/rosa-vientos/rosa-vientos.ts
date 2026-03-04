import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Highcharts from 'highcharts';
import * as HighchartsMoreModule from 'highcharts/highcharts-more';
import * as Papa from 'papaparse';

const initHighchartsMore = (HighchartsMoreModule as any).default || HighchartsMoreModule;
if (typeof initHighchartsMore === 'function') {
    initHighchartsMore(Highcharts);
}

@Component({
  selector: 'app-rosa-vientos',
  imports: [CommonModule],
  templateUrl: './rosa-vientos.html',
  styleUrl: './rosa-vientos.scss',
})
export class RosaVientos {
  isChartReady = false;
  fileName = '';
  categories = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  speedRanges = [
    { name: '< 2', min: 0, max: 2, color: '#4A90E2' },
    { name: '2 - 4', min: 2, max: 4, color: '#50E3C2' },
    { name: '4 - 6', min: 4, max: 6, color: '#B8E986' },
    { name: '6 - 8', min: 6, max: 8, color: '#F8E71C' },
    { name: '> 8', min: 8, max: 999, color: '#F5A623' }
  ];

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.parseCSV(file);
    }
  }

  parseCSV(file: File) {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        this.processAllData(result.data);
      }
    });
  }

  processAllData(data: any[]) {
    let counts = Array(this.speedRanges.length).fill(0).map(() => Array(16).fill(0));
    let totalRecords = 0;
    let timeLabels: string[] = [], tempS: number[] = [], humS: number[] = [], 
        rainS: number[] = [], radS: number[] = [], pressS: number[] = [];

    data.forEach(row => {
      // Datos Rosa de Vientos
      const speed = row['Velocidad del viento'];
      const direction = row['Direccion viento'];
      if (speed !== undefined && direction !== undefined) {
        totalRecords++;
        let dirIndex = Math.round(direction / 22.5) % 16;
        let speedIndex = this.speedRanges.findIndex(r => speed >= r.min && speed < r.max);
        if (speedIndex !== -1) counts[speedIndex][dirIndex]++;
      }
      // Datos Cronológicos
      if (row['hora'] !== undefined) {
        timeLabels.push(`${row['Dia']}/${row['Mes']} ${row['hora']}`);
        tempS.push(row['Temp exterior']);
        humS.push(row['Humedad exterior']);
        rainS.push(row['Lluvia'] || 0);
        radS.push(row['Radiacion solar'] || 0);
        pressS.push(row['Presion admosferica'] || 0);
      }
    });

    const windSeries = this.speedRanges.map((range, i) => ({
      name: range.name, type: 'column', color: range.color,
      data: counts[i].map(c => Number(((c / totalRecords) * 100).toFixed(2)))
    }));

    this.renderCharts(windSeries, timeLabels, tempS, humS, rainS, radS, pressS);
  }

  renderCharts(wind: any[], labels: string[], temp: number[], hum: number[], rain: number[], rad: number[], press: number[]) {
    this.isChartReady = true;
    setTimeout(() => {
      // 1. Rosa
      Highcharts.chart('wind-rose', {
        chart: { polar: true, type: 'column' },
        title: { text: 'Rosa de los Vientos' },
        xAxis: { categories: this.categories },
        yAxis: { min: 0, labels: { format: '{value}%' } },
        plotOptions: { column: { stacking: 'normal', groupPadding: 0, pointPlacement: 'on' } },
        series: wind as any
      });
      // 2. Temp/Hum
      Highcharts.chart('temp-hum', {
        chart: { type: 'spline' },
        title: { text: 'Temperatura y Humedad' },
        xAxis: { categories: labels, tickPixelInterval: 150 },
        yAxis: [{ title: { text: 'Temp (°C)' } }, { title: { text: 'Hum (%)' }, opposite: true }],
        series: [{ name: 'Temp', data: temp, color: '#e74c3c', yAxis: 0 }, { name: 'Hum', data: hum, color: '#3498db', yAxis: 1 }] as any
      });
      // 3. Lluvia/Rad
      Highcharts.chart('rain-rad', {
        chart: { type: 'column' },
        title: { text: 'Lluvia y Radiación Solar' },
        xAxis: { categories: labels },
        yAxis: [{ title: { text: 'Lluvia (mm)' } }, { title: { text: 'Rad (W/m²)' }, opposite: true }],
        series: [{ name: 'Lluvia', data: rain, color: '#2ecc71' }, { name: 'Radiación', type: 'area', data: rad, color: '#f1c40f', yAxis: 1, opacity: 0.3 }] as any
      });
      // 4. Presión
      Highcharts.chart('pressure', {
        chart: { type: 'spline' },
        title: { text: 'Presión Atmosférica' },
        xAxis: { categories: labels },
        yAxis: { title: { text: 'hPa' } },
        series: [{ name: 'Presión', data: press, color: '#9b59b6' }] as any
      });
    }, 200);
  }
}