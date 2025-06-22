import { Component, inject } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { firebaseErrors } from 'src/app/config/constants';
import { FormSignIn } from 'src/app/shared/models/interfaces';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import {
  hasEmailError,
  isRequired,
} from 'src/app/shared/utils/validators.service';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  imports: [ReactiveFormsModule, IonButton, IonContent]
})
export default class SignInComponent {

  private _utils = inject(UtilsService);
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);
  form = this._formBuilder.group<FormSignIn>({
    email: this._formBuilder.control('', [Validators.required, Validators.email]),
    password: this._formBuilder.control('', [Validators.required]),
  })

  async submit(){
  if (this.form.invalid) {
        toast.error('Formulario incorrecto ');
        return;
      }

  const { email, password } = this.form.value;
  try{
    if (!email || !password) {
      toast.error('Email y contraseña son obligatorios ');
      return;
    }
    await this._authService.signIn({email, password});
    toast.success('Inicio de sesión éxitoso');
    this.navigateTo('/home');
  } catch(error){
      let message = 'Ocurrió un error durante el inicio de sesión';
      if (error instanceof FirebaseError) {
        message =
          firebaseErrors[error.code as keyof typeof firebaseErrors] || message;
      }
      toast.error(message);  
  }
  }

  navigateTo(path: string) {
    this._utils.navigateTo(path);
  }

  isRequired(field: 'email' | 'password') {
    return isRequired(field, this.form);
  }

  hasEmailError() {
    return hasEmailError(this.form);
  }

}
