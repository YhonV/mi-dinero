import { FormControl } from "@angular/forms";

export interface Budget {
    id: number;
    categoryId : string;
    amount: number;
    iconoCategoria?: string;
    montoFormateado?: string;
    docId?: string;
}

export interface User {
    email: string;
    password: string;
    username?: string;
    comuna?: string;
    region?: string;
    isAdmin?: false;
}

export interface FormFeedback {
    subject: FormControl<string | null>
    message: FormControl<string | null>
}

export interface FormSignUp {
    username: FormControl<string | null>
    email: FormControl<string | null>
    password: FormControl<string | null>
    confirmPassword: FormControl<string | null>
    comuna: FormControl<string | null>
    region: FormControl<string | null>
}

export interface FormSignIn {
    email: FormControl<string | null>
    password: FormControl<string | null>
}

export interface FormForgotPassword{
    email: FormControl<string | null>
}

export interface Comuna {
    nombre: string,
    region: string
}

export interface Category {
    id: string;
    nombre: string;
    icono?: string;
  }
  
export interface Transaction {
    id: string;
    type: 'ingreso' | 'gasto';
    amount: number;
    categoryId: string;
    date: Date;
    categoryIcon?: string;
    formattedAmount?: string;
    docId?: string;
  }

export interface SavingAccount {
    id: string;
    nombre: string;
    amount: number;
    bankId: string;
    date: Date;
}

export interface Bank {
    codigo: string;
    nombre: string;
}

export interface TipFinanciero {
  id: string;
  title: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Logs {
    fecha: Date,
    mensaje: string,
    tipo: string
}