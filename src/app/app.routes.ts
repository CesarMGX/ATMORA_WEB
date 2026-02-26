import { Routes } from '@angular/router';
import { Home } from './features/landing/pages/home/home';
import { Auth } from './features/auth/pages/auth/auth';
import { Dashboard } from './features/admin/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth', component: Auth },
  { path: 'admin', component: Dashboard },
  { path: '**', redirectTo: '' }
];
