import { Routes } from "@angular/router";

export default [
    {
        path: 'sign-up',
        loadComponent: () => import ('./sign-up/sign-up.component'),
    },
    {
        path: 'sign-in',
        loadComponent: () => import ('./sign-in/sign-in.component'),
    },
    {
        path: 'forgot-password',
        loadComponent: () => import ('./forgot-password/forgot-password.component'),
    },
] as Routes