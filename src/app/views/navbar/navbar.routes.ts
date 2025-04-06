import { Routes } from "@angular/router";

export default [
    {
        path: 'home',
        loadComponent: () => import ('./home/home.component').then(m => m.default)
    },
    {
        path: 'dashboard',
        loadComponent: () => import ('./dashboard/dashboard.component').then(m => m.default)
    },
    {
        path: 'preferences',
        loadComponent: () => import ('./preferences/preferences.component').then(m => m.default)
    },
] as Routes