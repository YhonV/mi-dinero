import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { Comuna, FormSignUp } from 'src/app/shared/models/interfaces';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import {
  hasEmailError,
  isRequired,
} from 'src/app/shared/utils/validators.service';
import { firebaseErrors } from 'src/app/config/constants';
import { FirebaseError } from '@angular/fire/app';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { IonButton, IonContent } from '@ionic/angular/standalone';
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  imports: [ReactiveFormsModule, IonButton, IonContent],
  providers: [AuthService],
})
export default class SignUpComponent implements OnInit {
  private _firestoreService = inject(FirestoreService);
  private _utils = inject(UtilsService);
  private _authService = inject(AuthService);
  private _formBuilder = inject(FormBuilder);
  direcciones: Comuna[] = [];

  form = this._formBuilder.group<FormSignUp>({
    username: this._formBuilder.control('', [Validators.required]),
    email: this._formBuilder.control('', [
      Validators.required,
      Validators.email,
    ]),
    password: this._formBuilder.control('', [Validators.required]),
    confirmPassword: this._formBuilder.control('', [Validators.required]),
    comuna: this._formBuilder.control('', [Validators.required]),
    region: this._formBuilder.control('', [Validators.required]),
  });

  async ngOnInit() {
    this.direcciones = await this._firestoreService.getDirecciones();
  }

  getRegionesUnicas(): string[] {
    const regiones = this.direcciones.map((direccion) => direccion.region);
    return [...new Set(regiones)].sort();
  }

  getComunasOfRegiones(region: string | null | undefined): Comuna[] {
    if (!region) return [];
    return this.direcciones.filter((direccion) => direccion.region === region);
  }

  async submit() {
    if (this.form.invalid) {
      toast.error('Formulario incorrecto');
      return;
    }
    try {
      const { email, password, confirmPassword, username } = this.form.value;

      if (!email || !password || !confirmPassword || !username) {
        toast.error('Email y contraseña son obligatorios');
        return;
      }

      if (password != confirmPassword) {
        toast.error('Contraseñas deben ser iguales');
        return;
      }

      const credential = await this._authService.signUp({ email, password });
      toast.success(
        ' Registrado correctamente, se redirigirá en unos segundos...'
      );
      const uid = credential.user.uid;
      await this._authService.createUser(
        uid,
        this.form.value.username || '',
        this.form.value.region || '',
        this.form.value.comuna || '',
        this.form.value.email || '',
      );

      this.navigateTo('/home');
      
      await this._firestoreService.createLog(uid, 'Usuario registrado', 'registro');

    } catch (error) {
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
