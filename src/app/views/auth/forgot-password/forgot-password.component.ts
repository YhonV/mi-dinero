import { Component, inject, OnInit } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { firebaseErrors } from 'src/app/config/constants';
import { FormForgotPassword } from 'src/app/shared/models/interfaces';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import { hasEmailError, isRequired } from 'src/app/shared/utils/validators.service';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  imports: [ReactiveFormsModule, IonButton, IonContent]
})
export default class ForgotPasswordComponent {
  private _utils = inject(UtilsService);
  private _formBuilder = inject(FormBuilder);
  private _auth = inject(AuthService);
  form = this._formBuilder.group<FormForgotPassword>({
    email : this._formBuilder.control('', [Validators.required, Validators.email])
  })

  constructor() { }

  navigateTo(path: string) {
      this._utils.navigateTo(path);
  }

  isRequired(field: 'email' | 'password') {
    return isRequired(field, this.form);
  }

  hasEmailError() {
    return hasEmailError(this.form);
  }

  async submit(){
    if(this.form.invalid){
      toast.error('Formulario invalido ❌');
      return;
    }
    try{
      const {email} = this.form.value
      if (!email){
        toast.error('Correo invalido ❌');
        return;
      }
      await this._auth.recoveryPassword(email)
      toast.success('✅ Correo de recuperación enviado a ' + email);
      this.navigateTo('/auth/sign-in');
    } catch(error){
      let message = 'Ocurrió un error durante la recuperación de contraseña';
      if (error instanceof FirebaseError){
        message = firebaseErrors[error.code as keyof typeof firebaseErrors] || message;
      }
      toast.error(message + ' ❌ ');  
    }
  }

}
