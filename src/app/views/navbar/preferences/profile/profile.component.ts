import { Component, inject, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import {
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
} from '@ionic/angular/standalone';
import {
  saveOutline,
  star,
  home,
  locationOutline,
  mailOutline,
  personOutline,
} from 'ionicons/icons';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Auth } from '@angular/fire/auth';
import { User } from 'src/app/shared/models/interfaces';
import { UtilsService } from 'src/app/shared/utils/utils.service';
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
  ],
})
export default class ProfileComponent implements OnInit {
  private _firestore = inject(FirestoreService);
  private _auth = inject(Auth);
  userData: User | null = null
  private _utils = inject(UtilsService);
  constructor() {
    addIcons({
      saveOutline,
      star,
      home,
      locationOutline,
      mailOutline,
      personOutline,
    });
  }

  async ngOnInit() {
    const loading = await this._utils.loadingSpinner();
    await loading.present();
    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.userData = await this._firestore.getUser(user["uid"]);
        await loading.dismiss();
      } else{
        console.log("no user");
        this.userData = null;  
      }
    }) 
  }

  
}
