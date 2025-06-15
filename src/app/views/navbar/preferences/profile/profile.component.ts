import { Component, inject, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonLabel,
  IonItem,
  IonList,
  IonAvatar,
  IonContent,
  IonButtons,
  IonButton,
  IonTitle,
  IonBackButton,
  IonToolbar,
  IonHeader,
  IonCard,
  IonCardContent,
  IonInput

} from '@ionic/angular/standalone';
import {
  saveOutline,
  star,
  home,
  locationOutline,
  mailOutline,
  personOutline,
  colorFilterOutline,
  createOutline,
  personCircleOutline
} from 'ionicons/icons';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Auth } from '@angular/fire/auth';
import { Comuna, User } from 'src/app/shared/models/interfaces';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { UserService } from 'src/app/shared/services/user/user.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    IonIcon,
    IonLabel,
    IonItem,
    IonList,
    IonAvatar,
    IonContent,
    IonButtons,
    IonTitle,
    IonBackButton,
    IonToolbar,
    IonHeader,
    IonCard,
    IonCardContent,
    IonButton,
    IonInput,
    FormsModule,
    CommonModule
  ],
})
export default class ProfileComponent implements OnInit {
  private _firestore = inject(FirestoreService);
  private _auth = inject(Auth);
  private _authService  = inject(AuthService)
  userData: User | null = null
  private _utils = inject(UtilsService);
  editar = false;
  uid : string = '';
  direcciones: Comuna[]=[];

  constructor(private userService: UserService) {
    addIcons({
      saveOutline,
      star,
      home,
      locationOutline,
      mailOutline,
      personOutline,
      createOutline,
      personCircleOutline
    });

  }

  async ngOnInit() {
    const loading = await this._utils.loadingSpinner();
    await loading.present();
    try {
        this.loadDirecciones()
        await this.userService.waitForAuth();

        if (this.userService.isAuthenticated()) {
          this.userData = this.userService.getUser();
          this.uid = this.userService.getUid();
          await loading.dismiss();
        } else {
          console.log("No user authenticated");
          this.userData = null;
        }
      } catch(error) {
        console.error("Error loading data:", error);
      }
  }

  private async loadDirecciones() {
    const cacheDirecciones = sessionStorage.getItem('direcciones');
      if (cacheDirecciones) {
        this.direcciones = JSON.parse(cacheDirecciones);
      } else {
        this.direcciones = await this._firestore.getDirecciones();
        sessionStorage.setItem('direcciones', JSON.stringify(this.direcciones));
      }
  }



  getRegionesUnicas(): string[] {
    const regiones = this.direcciones.map((direccion) => direccion.region);
    return [...new Set(regiones)].sort();
  }

  getComunasOfRegiones(region: string | null | undefined): Comuna[] {
    if (!region) return [];
    return this.direcciones.filter((direccion) => direccion.region === region);
  }

modoEditar(){
  this.editar = !this.editar;
  toast.message(" ✏️ Ahora puedes editar tus datos ")
}

  async guardarCambios(){
    this.editar = false;
    
    if (!this.userData || !this.userData.username || !this.userData.region || !this.userData.comuna){
      toast.warning("Debes completar todos los campos")
      this.editar = true
      return
    }
      this._authService.editUser(this.uid, this.userData.username, this.userData.region, this.userData.comuna);
      toast.success("Datos actualizados correctamente")
      await this._firestore.createLog(this.uid, "Usuario actualiza sus datos", "Perfil")
    } 
}
