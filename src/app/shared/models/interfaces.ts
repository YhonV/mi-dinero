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
}