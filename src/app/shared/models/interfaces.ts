import { FormControl } from "@angular/forms";

export interface User {
    email: string,
    password: string,
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

export interface Comuna {
    nombre: string,
    region: string
}