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

  banks: Bank[]=
    [
      { "codigo": "001", "nombre": "Banco De Chile" },
      { "codigo": "009", "nombre": "Banco Internacional" },
      { "codigo": "014", "nombre": "Scotiabank Chile" },
      { "codigo": "016", "nombre": "Banco De Credito E Inversiones" },
      { "codigo": "028", "nombre": "Banco Bice" },
      { "codigo": "031", "nombre": "Hsbc Bank (Chile)" },
      { "codigo": "037", "nombre": "Banco Santander-Chile" },
      { "codigo": "039", "nombre": "Banco Itaú Chile" },
      { "codigo": "049", "nombre": "Banco Security" },
      { "codigo": "051", "nombre": "Banco Falabella" },
      { "codigo": "053", "nombre": "Banco Ripley" },
      { "codigo": "055", "nombre": "Banco Consorcio" },
      { "codigo": "059", "nombre": "Banco Btg Pactual Chile" },
      { "codigo": "062", "nombre": "Tanner Banco Digital" },
      { "codigo": "012", "nombre": "Banco Del Estado De Chile" }
    ];
    
  constructor() { }

  async ngOnInit() {
    this.bancos = await this._firestore.getBanks()
    this._firestore.createBanks(this.banks)
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
