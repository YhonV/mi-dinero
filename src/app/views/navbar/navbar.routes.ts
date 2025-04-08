import { Routes } from "@angular/router";
import NavbarComponent from "./navbar.component";

export default [
    {
        path: 'navbar',
        component: NavbarComponent,
        children: [
            {
                path: 'home',
                loadComponent: () => import('./home/home.component').then(m => m.default)
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard.component').then(m => m.default)
            },
            {
                path: 'preferences',
                loadComponent: () => import('./preferences/preferences.component').then(m => m.default)
            },
            {
                path: 'navbar',
                loadComponent: () => import('./navbar.component').then(m => m.default)
            },
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    }
] as Routes
