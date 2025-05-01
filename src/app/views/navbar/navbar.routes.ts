import { Routes } from "@angular/router";
import NavbarComponent from "./navbar.component";

export default [
    {
        path: '',
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
                path: 'budget',
                loadComponent: () => import('./budget/budget.component').then(m => m.default)
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
    },
    {
        path: 'preferences/profile',
        loadComponent: () => import('./preferences/profile/profile.component').then(m => m.default)
    },
    {
        path: 'preferences/notifications',
        loadComponent: () => import('./preferences/notifications/notifications.component').then(m => m.default)
    },
    {
        path: 'preferences/feedback',
        loadComponent: () => import('./preferences/feedback/feedback.component').then(m => m.default)
    },
    {
        path: 'preferences/change-password',
        loadComponent: () => import('./preferences/change-password/change-password.component').then(m => m.default)
    },
] as Routes
