import { Routes } from '@angular/router';
import { Home } from './features/landing/pages/home/home';
import { Auth } from './features/auth/pages/auth/auth';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { adminGuard } from './core/guards/admin-guard';
import { Layout } from './features/admin/layout/layout';
import { Monitor } from './features/admin/pages/monitor/monitor';
import { Usuarios } from './features/admin/pages/usuarios/usuarios';
import { RosaVientos } from './features/admin/pages/rosa-vientos/rosa-vientos';
import { Perfil } from './features/admin/pages/perfil/perfil';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth', component: Auth },
  
  // Admin
  { 
    path: 'admin',
    component: Layout,
    canActivate: [adminGuard], 
    children: [
      { path: '', redirectTo: 'monitor', pathMatch: 'full' },
      { path: 'monitor', component: Monitor },
      { path: 'usuarios', component: Usuarios },
      { path: 'rosa-vientos', component: RosaVientos },
    ]
  },

  // Perfil
  { path: 'perfil', component: Perfil }, 

  { path: '**', redirectTo: '' }
];
