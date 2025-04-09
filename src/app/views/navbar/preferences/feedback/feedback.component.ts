import { Component, OnInit } from '@angular/core';
import { IonButton, IonTextarea, IonItem, IonInput, IonLabel, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonIcon, IonContent, IonTitle, IonBackButton, IonButtons, IonToolbar, IonHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  paperPlane
} from 'ionicons/icons';
@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  imports: [IonButton, IonTextarea, IonItem, IonInput, IonLabel, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonIcon, IonContent, IonTitle, IonBackButton, IonButtons, IonToolbar, IonHeader]
})
export default class FeedbackComponent  implements OnInit {

  constructor() { 
    addIcons({ paperPlane })
  }

  ngOnInit() {}

}
