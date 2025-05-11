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
  createOutline
} from 'ionicons/icons';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Auth } from '@angular/fire/auth';
import { Comuna, User } from 'src/app/shared/models/interfaces';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';
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
  userData: User | null = null
  private _utils = inject(UtilsService);
  editar = false;
  uid : string = '';
  direcciones: Comuna[]=[];

  constructor() {
    addIcons({
      saveOutline,
      star,
      home,
      locationOutline,
      mailOutline,
      personOutline,
      createOutline
    });

  }

  async ngOnInit() {
    this.direcciones = await this._firestore.getDirecciones();
    const loading = await this._utils.loadingSpinner();
    await loading.present();
    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.userData = await this._firestore.getUser(user["uid"]);
        this.uid = user["uid"];
        await loading.dismiss();
      } else{
        console.log("no user");
        this.userData = null;  
      }
    }) 
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

  guardarCambios(){
    console.log("uid en guardarCambios " + this.uid)
    this.editar = false;
  }


  
}
