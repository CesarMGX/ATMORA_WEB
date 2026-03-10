import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Definimos qué datos guardaremos del perfil
export interface UserProfile {
  id: number;
  nombre: string;
  correo: string;
  avatar: string;
  rol: 'Admin' | 'Usuario'; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // El "megáfono" que avisa a toda la app si hay alguien logueado
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  
  // Variable pública a la que se suscribirá el Navbar
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  constructor() {
    // Cuando la app carga o si el usuario recarga la página, revisamos si ya estaba logueado
    this.checkInitialSession();
  }

  private checkInitialSession() {
    const storedUser = localStorage.getItem('atmora_user');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // --- FUNCIÓN DE LOGIN SIMULADO ---
  login(correo: string, password: string): boolean {
    // Por ahora, simulamos que el login es exitoso con cualquier dato
    
    const mockUser: UserProfile = {
      id: 1,
      nombre: 'Cesar Mundo', // Simulamos que entraste tú
      correo: correo,
      rol: 'Admin',
      avatar: `https://ui-avatars.com/api/?name=Cesar+Mundo&background=0f3460&color=fff`
    };

    // 1. Guardamos en localStorage para no perder la sesión al recargar con F5
    localStorage.setItem('atmora_user', JSON.stringify(mockUser));
    localStorage.setItem('atmora_token', 'fake-jwt-token-123456');

    // 2. Avisamos al Navbar que cambie la interfaz
    this.currentUserSubject.next(mockUser);
    
    return true; // Retornamos éxito
  }

  // --- FUNCIÓN PARA CERRAR SESIÓN ---
  logout() {
    // 1. Borramos los datos del navegador
    localStorage.removeItem('atmora_user');
    localStorage.removeItem('atmora_token');
    
    // 2. Avisamos al Navbar que regrese a estado "desconectado"
    this.currentUserSubject.next(null);
  }

  // --- FUNCIÓN PARA ACTUALIZAR EL PERFIL ---
  updateProfile(updatedUser: UserProfile) {
    // 1. Guardamos los nuevos datos en el almacenamiento del navegador
    localStorage.setItem('atmora_user', JSON.stringify(updatedUser));
    
    // 2. Gritamos por el megáfono para que el Navbar y el Layout se actualicen al instante
    this.currentUserSubject.next(updatedUser);
  }

  // Utilidad para saber si hay sesión activa en un momento exacto
  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Obtener los datos exactos del usuario actual
  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }
}