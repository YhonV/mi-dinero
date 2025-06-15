import { Component, OnInit } from '@angular/core';
import {IonContent, IonSegment, IonSegmentButton, IonLabel, IonIcon} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Logs, User } from 'src/app/shared/models/interfaces';


@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  imports: [IonContent, CommonModule, IonSegment, IonSegmentButton, IonLabel, FormsModule, IonIcon]
})
export class AdminDashboardComponent  implements OnInit {
  selectedSegment: string = 'usuarios';
  userData: User[] = []
  logs: Logs[] = []

  constructor(private _firestoreService: FirestoreService) {
    addIcons({
      trashOutline
    })
   }

  ngOnInit() {
    this.getAllUsers();
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async getAllUsers(){
    this.userData = await this._firestoreService.getGenericCollection<User>("users");
  }

  async getAllLogs(){
    this.logs = await this._firestoreService.getGenericCollection<Logs>("logs");
  }

  async deleteUser(){

  }

}
