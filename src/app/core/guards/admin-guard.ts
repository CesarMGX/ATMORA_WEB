import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Recuperamos el rol guardado en el navegador
  const userRole = localStorage.getItem('userRole');

  // Verificamos si es administrador
  if (userRole === 'admin') {
    return true;
  } else {
    // 3. Si no es admin, lo mandamos al login o al inicio
    alert('ACCESO DENEGADO: Se requieren privilegios de Administrador.');
    router.navigate(['/auth']);
    return false;
  }
};