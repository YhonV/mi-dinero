import { Component, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonButtons, IonTitle, IonBackButton, IonToolbar }   from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonButtons,  IonTitle, IonBackButton, IonToolbar]
})
export default class ChangePasswordComponent  {
  
}
