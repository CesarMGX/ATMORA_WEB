import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Ubicacion {
  id?: number;
  id_ubicacion?: number;
  nombre: string;
  nombre_ubicacion?: string;
  descripcion: string;
  latitud?: number;
  longitud?: number;
  estado?: 'activo' | 'inactivo';
}

export interface Dispositivo {
  id?: number;
  id_dispositivo?: number;
  nombre: string;
  nombre_dispositivo?: string;
  estado: 'activo' | 'inactivo' | 'mantenimiento' | 'falla';
  ubicacion_id?: number;
  id_ubicacion?: number;
  fecha_instalacion?: string;
}

export interface Lectura {
  id?: number;
  id_historial?: number;
  dispositivo_id?: number;
  id_dispositivo?: number;
  humedad: number;
  presion: number;
  radiacion: number;
  radiacion_solar?: number;
  temperatura: number;
  fecha_registro?: string;
  fecha_hora?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AtmoraService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Ubicaciones ───────────────────────────────────────────────────────────
  obtenerUbicaciones(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ubicaciones`);
  }

  crearUbicacion(ubicacion: Ubicacion): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ubicaciones`, ubicacion);
  }

  // ─── Dispositivos ─────────────────────────────────────────────────────────
  obtenerDispositivos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dispositivos`);
  }

  crearDispositivo(dispositivo: Dispositivo): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/dispositivos`, dispositivo);
  }

  obtenerUltimaLectura(dispositivoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dispositivos/${dispositivoId}/ultima-lectura`);
  }

  // ─── Predicción de Inteligencia Artificial ──────────────────────────────────
  predecirTemperatura(datos: { humedad: number; presion: number; radiacion: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/predecir`, datos);
  }
}
