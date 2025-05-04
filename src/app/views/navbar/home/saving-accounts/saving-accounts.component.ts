import { Component, inject, OnInit } from '@angular/core';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import {IonHeader, IonTitle, IonButtons, IonBackButton, IonToolbar, IonContent, IonIcon} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Bank, SavingAccount, User } from 'src/app/shared/models/interfaces';
import { toast } from 'ngx-sonner';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-saving-accounts',
  templateUrl: './saving-accounts.component.html',
  styleUrls: ['./saving-accounts.component.scss'],
  imports: [FormsModule, CommonModule, IonHeader, IonTitle, IonButtons, IonBackButton, IonToolbar, IonContent, IonIcon]
})
export default class SavingAccountsComponent  implements OnInit {
  private _utils = inject(UtilsService)
  private _firestore = inject(FirestoreService)
  private _auth = inject(Auth)
  
  uid: string = '';
  userData: User | null = null
  isModalOpen: boolean = false;
  bancos: Bank[] = [];
  cuentas: SavingAccount[] = [];
  nombre: string = '';
  monto: number= 0;
  bancoSeleccionado: string= '';
    
  constructor() { }

  async ngOnInit() {
    this.bancos = await this._firestore.getBanks()
    
    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.uid = user.uid;
        this.userData = await this._firestore.getUser(user["uid"]);
        this.loadAccounts();
      } else{
        console.log("no user");
        this.userData = null;  
      }
    })
  }

  async loadAccounts(){
    if (this.uid){
      const accounts = await this._firestore.getSavingAccounts(this.uid);
      this.cuentas = Array.isArray(accounts) ? accounts : [];
    }
    else {
      this.cuentas = [];
    }
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

  async saveSavingAccounts(): Promise <void> {
    if (this.nombre === '' || this.monto <= 0 || this.bancoSeleccionado === ''){
      toast.error('Por favor, completa todos los campos correctamente.')
      return;
    }
  const savingAccount: SavingAccount = {
    id: Date.now().toString(),
    nombre: this.nombre,
    amount: this.monto,
    bankId: this.bancoSeleccionado,
    date: new Date()
  }
  await this._firestore.createSavingAccount(this.uid, savingAccount)
  toast.success('✅ Cuenta de ahorro creada exitosamente')

  await this.loadAccounts();
  this.nombre= '';
  this.monto = 0;
  this.bancoSeleccionado = ''
  this.closeModal()
  }

  getSortedAccounts(): SavingAccount[]{
    return this.cuentas.slice().sort((a,b) =>{
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
  }

  getTotalSavingAccounts(): number {
    return this.cuentas.reduce((sum, cuenta) => sum + cuenta.amount, 0);
  }


}
