import { Component, OnInit } from '@angular/core';
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

  ngOnInit() {}
}
