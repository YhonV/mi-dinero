import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./views/auth/auth.routes'),
  },
  {
    path: 'navbar',
    loadChildren: () => import('./views/navbar/navbar.routes'),
  }
];
