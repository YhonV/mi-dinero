import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { FormSignUp } from 'src/app/shared/models/interfaces';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import { hasEmailError, isRequired } from 'src/app/shared/utils/validators.service';
import { firebaseErrors } from 'src/app/config/constants';
import { FirebaseError } from '@angular/fire/app';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  imports: [ReactiveFormsModule],
  providers: [AuthService]
})

export default class SignUpComponent implements OnInit{
  
  ngOnInit() {}
  
  private _utils = inject(UtilsService)
  private _authService = inject(AuthService);
  private _formBuilder = inject(FormBuilder);
  
  form = this._formBuilder.group<FormSignUp>({
    username: this._formBuilder.control('', [Validators.required]),
    email: this._formBuilder.control('', [Validators.required, Validators.email]),
    password: this._formBuilder.control('', [Validators.required]),
    confirmPassword: this._formBuilder.control('', [Validators.required]),
  });

  async submit(){
    if (this.form.invalid) {
      toast.success('Formulario incorrecto ❌')
      return;
    }
    try{
      const { email, password, confirmPassword, username } = this.form.value;
      console.log({email, password, confirmPassword, username})

      if (!email || !password || !confirmPassword || !username) {
        toast.error('Email y contraseña son obligatorios ❌');
        return;
      }

      if (password != confirmPassword){
        toast.error('Contraseñas deben ser iguales ❌');
        return;
      }
      
      await this._authService.signUp({ email, password });
      toast.success(' ✅ Registrado correctamente, se redirigirá en unos segundos...');
      this.navigateTo('/navbar/home')
    } catch(error){
      let message = 'Ocurrió un error durante el inicio de sesión';
      if(error instanceof FirebaseError){
        message = firebaseErrors[error.code as keyof typeof firebaseErrors] || message;}
      toast.error(message + ' ❌ ')
    }
 }

  navigateTo(path : string){
    this._utils.navigateTo(path);
  }

  isRequired(field: 'email' | 'password') {
    return isRequired(field, this.form);
  }

  hasEmailError() {
    return hasEmailError(this.form);
  }
}
