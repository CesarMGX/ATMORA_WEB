import { Routes } from '@angular/router';
import { Home } from './features/landing/pages/home/home';
import { Auth } from './features/auth/pages/auth/auth';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { adminGuard } from './core/guards/admin-guard';
import { Layout } from './features/admin/layout/layout';
import { Monitor } from './features/admin/pages/monitor/monitor';
import { Usuarios } from './features/admin/pages/usuarios/usuarios';
import { RosaVientos } from './features/admin/pages/rosa-vientos/rosa-vientos';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth', component: Auth },
{ 
    path: 'admin', 
    component: Layout,
    canActivate: [adminGuard], // SE APLICA LA SEGURIDAD
    children: [
      { path: '', redirectTo: 'monitor', pathMatch: 'full' }, // Por defecto abre el Monitor
      { path: 'monitor', component: Monitor },       // Gráficas
      { path: 'usuarios', component: Usuarios },     // CRUD Dinámico
      { path: 'rosa-vientos', component: RosaVientos } // Excel
    ]
  },
  { path: '**', redirectTo: '' }
];
