import { Routes } from '@angular/router';
import { noAuthGuard } from './guards/no-auth.guard';
import { authGuard } from './guards/auth.guard';
import { onlyAdminGuard } from './guards/only-admin.guard';
import { NavbarAdminComponent } from './views/navbar-admin/navbar-admin.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./views/auth/auth.routes'),
    // canActivate: [noAuthGuard]
  },
  {
    path: '',
    loadChildren: () => import('./views/navbar/navbar.routes'),
    // canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: NavbarAdminComponent, 
    canActivateChild: [onlyAdminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./views/navbar-admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/sign-in'
  }
];

