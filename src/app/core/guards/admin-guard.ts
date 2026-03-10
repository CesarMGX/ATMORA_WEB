import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const user = authService.getCurrentUser();

  // Verificamos si existe usuario y si su rol es admin
  if (user && user.rol === 'Admin') {
    return true;
  } else {
    alert('ACCESO DENEGADO: Se requieren privilegios de Administrador.');
    router.navigate(['/auth']);
    return false;
  }
};