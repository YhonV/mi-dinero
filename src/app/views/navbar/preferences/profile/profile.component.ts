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
    this._auth.onAuthStateChanged(async user => {
      if(user){
        console.log(user.uid);
        this.userData = await this._firestore.getUser(user["uid"]);
      } else{
        console.log("no user");
        this.userData = null;  
      }
    })
    
  }
}
