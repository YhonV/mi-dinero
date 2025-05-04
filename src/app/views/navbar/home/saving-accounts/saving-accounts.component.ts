import { Component, inject, OnInit } from '@angular/core';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import {IonHeader, IonTitle, IonButtons, IonBackButton, IonToolbar, IonContent, IonIcon} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Bank } from 'src/app/shared/models/interfaces';


@Component({
  selector: 'app-saving-accounts',
  templateUrl: './saving-accounts.component.html',
  styleUrls: ['./saving-accounts.component.scss'],
  imports: [CommonModule, IonHeader, IonTitle, IonButtons, IonBackButton, IonToolbar, IonContent, IonIcon]
})
export default class SavingAccountsComponent  implements OnInit {
  private _utils = inject(UtilsService)
  private _firestore = inject(FirestoreService)
  isModalOpen: boolean = false;
  bancos: Bank[] = [];

    
  constructor() { }

  async ngOnInit() {
    this.bancos = await this._firestore.getBanks()
  }

  navigateTo(path: string) {
    this._utils.navigateToWithoutLoading(path);
  }

  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false; 
  }

}
