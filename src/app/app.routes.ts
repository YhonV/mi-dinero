import { Routes } from '@angular/router';
import { noAuthGuard } from './guards/no-auth.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./views/auth/auth.routes'),
    canActivate: [noAuthGuard]
  },
  {
    path: 'navbar',
    loadChildren: () => import('./views/navbar/navbar.routes'),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/auth/sign-in'
  }
];
