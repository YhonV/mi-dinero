import { Routes } from "@angular/router";
import NavbarComponent from "./navbar.component";
import { notAdminUserGuard } from "src/app/guards/not-admin-user.guard";

export default [
    {
        path: '',
        component: NavbarComponent,
        canActivateChild: [notAdminUserGuard],
        children: [
            {
                path: 'home',
                loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
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
                loadComponent: () => import('./preferences/preferences.component').then(m => m.PreferencesComponent)
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
    {
        path: 'home/saving-accounts',
        loadComponent:() => import('./home/saving-accounts/saving-accounts.component').then(m => m.default)
    },
    {
        path: 'preferences/faq',
        loadComponent: () => import('./preferences/faq/faq.component').then(m => m.FaqComponent)
    },
] as Routes
