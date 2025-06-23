import { Component, inject, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonButtons, IonTitle, IonBackButton, IonToolbar, IonButton }   from '@ionic/angular/standalone';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { isRequiredPwd } from 'src/app/shared/utils/validators.service';
import { ChangePassword, User } from 'src/app/shared/models/interfaces';
import { toast } from 'ngx-sonner';
import { firebaseErrors } from 'src/app/config/constants';
import { FirebaseError } from '@angular/fire/app';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { UserService } from 'src/app/shared/services/user/user.service';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { User as FirebaseAuthUser } from '@angular/fire/auth'; // <--- IMPORTANTE: Renombra el User de Firebase Auth
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonButtons,  IonTitle, IonBackButton, IonToolbar, IonButton]
})

export default class ChangePasswordComponent implements OnInit  {
  
  uid : string = '';
  form!: FormGroup;
  private _authService  = inject(AuthService);
  private _firestore = inject(FirestoreService);
  private userService= inject(UserService);
  currentUser: FirebaseAuthUser | null = null;
  isLoading: boolean = false;


  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController
    
  ) {
    this.form = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPass: ['',  [Validators.required]],
  }, {
    validators: this.passwordMatchValidator
  });
  }

  goBack() {
    this.navCtrl.back();
  }

  async ngOnInit() {
   this.currentUser = this._authService.getCurrentFirebaseUser();
   if (this.currentUser){
    this.uid = this.currentUser.uid;
   } else {
    console.log('No hay usuario autenticado')
   }
  }

  passwordMatchValidator (form: FormGroup){
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPass = form.get('confirmNewPass')?.value;
    return newPassword === confirmNewPass ? null : {mismatch: true};
  }

  async submit(){
  if (this.form.invalid) {
    if (this.form.errors?.['mismatch']){
      toast.warning('Las nuevas contraseñas no coinciden')
    } else {
      toast.error('Formulario inválido, completa los campos correctamente ');
    }
      return;
    }

    const { oldPassword, newPassword} = this.form.value;

    try {
      if (!this.currentUser){
        console.log('No hay usuario autenticaodo');
        return;
      }

      await this._authService.reauthenticateUser(this.currentUser, oldPassword);
      await this._authService.editPassword(this.currentUser, newPassword);
      this.isLoading = true

      setTimeout (() =>{
        toast.success('Contraseña actualizada correctamente');
      }, 1000);
      this.form.reset()

      if (this.uid) {
         await this._firestore.createLog(this.uid, "Usuario actualiza su contraseña", "Perfil");
      }
    } catch (error) {
      let message = 'Ocurrió un error al cambiar la contraseña';
      if (error instanceof FirebaseError) {
        message = firebaseErrors[error.code as keyof typeof firebaseErrors] || message;
      }
      toast.error('Error al cambiar la contraseña')
      console.log('Error al cambiar la contraseña: ', error);
    } finally {
      this.isLoading = false;

    }
    
  }

  isRequired(field: 'oldPassword' | 'newPassword' | 'confirmNewPass') {
      return isRequiredPwd(field, this.form);
  }


  
}
