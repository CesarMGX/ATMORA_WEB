import { Routes } from '@angular/router';
import { Home } from './features/landing/pages/home/home';
import { Auth } from './features/auth/pages/auth/auth';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth', component: Auth },
  { path: '**', redirectTo: '' }
];
