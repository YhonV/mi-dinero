import { Component, inject, OnInit } from '@angular/core';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import {IonHeader, IonTitle, IonButtons, IonBackButton, IonToolbar, IonContent, IonIcon, IonButton} from '@ionic/angular/standalone';
import {createOutline, trashOutline, addCircleOutline, checkmarkCircleOutline} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Bank, SavingAccount, User } from 'src/app/shared/models/interfaces';
import { toast } from 'ngx-sonner';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { UserService } from 'src/app/shared/services/user/user.service';


@Component({
  selector: 'app-saving-accounts',
  templateUrl: './saving-accounts.component.html',
  styleUrls: ['./saving-accounts.component.scss'],
  imports: [FormsModule, CommonModule, IonHeader, IonTitle, IonButtons, IonBackButton, IonToolbar, IonContent, IonIcon, IonButton]
})
export default class SavingAccountsComponent implements OnInit {
  private _utils = inject(UtilsService)
  private _firestore = inject(FirestoreService)
  
  uid: string = '';
  userData: User | null = null
  isModalOpen: boolean = false;
  id: string = ''
  bancos: Bank[] = [];
  cuentas: SavingAccount[] = [];
  nombre: string = '';
  monto: number= 0;
  bancoSeleccionado: string= '';
  modalMode: 'add' | 'edit' = 'add';
  isModalToDeleteSaving : boolean = false;
  dataSavingToDelete !: SavingAccount;
  montoFormateado: string = '$0';
  
  constructor(private userService: UserService) {
    addIcons({
      createOutline,
      trashOutline,
      addCircleOutline,
      checkmarkCircleOutline
      });
   }

  async ngOnInit() {
      try {
        const cachedBanks = sessionStorage.getItem('banks');
        if (cachedBanks) {
          this.bancos = JSON.parse(cachedBanks);
        } else {
          this.bancos = await this._firestore.getBanks();
          sessionStorage.setItem('banks', JSON.stringify(this.bancos));
        }

        await this.userService.waitForAuth();

        if (this.userService.isAuthenticated()) {
          this.userData = this.userService.getUser();
          this.uid = this.userService.getUid();
          await this.loadAccounts();
        } else {
          console.log("No user authenticated");
          this.userData = null;
        }
      } catch(error) {
        console.error("Error loading data:", error);
      }
  }

  onMontoInput(event: any) {
    const rawValue = event.target.value.replace(/\D/g, ''); 
    this.monto = Number(rawValue);
    this.montoFormateado = this.formatCLP(this.monto);
  }

  formatCLP(valor: number): string {
    return valor.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    });
  }

  async loadAccounts(){
    if (this.uid){
      const genericAccounts = await this._firestore.getCollectionInUsers(this.uid, "saving_accounts")
      const accounts: SavingAccount[] = [];
      genericAccounts.forEach((doc)=> {
        const data = doc.data();

        const date = data['date']?.toDate() || new Date();
        accounts.push({id: doc.id, ...data, date:date} as SavingAccount);
      });

      this.cuentas = Array.isArray(accounts) ? accounts : [];
    }
    else {
      this.cuentas = [];
    }
  }

  navigateTo(path: string) {
    this._utils.navigateToWithoutLoading(path);
  }

  openModal(mode: 'add' | 'edit' = 'add', cuenta?: SavingAccount) {
    this.modalMode = mode;

    if (mode == 'add'){
      this.nombre = '';
      this.monto = 0;
      this.bancoSeleccionado= '';
    } else if (mode === 'edit' && cuenta){
      this.nombre = cuenta.nombre;
      this.monto = cuenta.amount;
      this.bancoSeleccionado = cuenta.bankId;
      this.id = cuenta.id
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false; 
  }

  editAccount(cuenta: SavingAccount) {
    this.openModal('edit', cuenta);
  }

  async deleteAccount(cuenta: SavingAccount){
    const confirmDelete = confirm("¿Estás seguro que deseas eliminar esta cuenta?")
    if (!confirmDelete) return;

    try{
      await this._firestore.deleteSavingAccount(this.uid, cuenta)
      this.cuentas = this.cuentas.filter(c => c.id !== cuenta.id);
      console.log(`Eliminando cuenta con ID: ${cuenta.id}`);

      toast.success("Cuenta eliminada correctamente")
    } catch (error) {
      toast.error ("Error eliminando la cuenta")
    }

  }

  async saveSavingAccounts(): Promise <void> {
    if (this.nombre === '' || this.monto <= 0 || this.bancoSeleccionado === ''){
      toast.error('Por favor, completa todos los campos correctamente.')
      return;
    }
  const savingAccount: SavingAccount = {
    id: this.modalMode === 'edit' ? this.id: Date.now().toString(),
    nombre: this.nombre,
    amount: this.monto,
    bankId: this.bancoSeleccionado,
    date: new Date()
  };
  if (this.modalMode === 'edit'){
    await this._firestore.updateSavingAccount(this.uid, savingAccount);
    toast.success('✏️ Cuenta actualizada correctamente')
  }else {
    await this._firestore.createSavingAccount(this.uid, savingAccount)
    toast.success('✅ Cuenta creada exitosamente')
  }
  
  await this.loadAccounts();
  this.montoFormateado = '$0';
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

  openModalToDeleteSaving(selectedSaving : SavingAccount){
    this.dataSavingToDelete = selectedSaving;
    console.log(this.dataSavingToDelete)
    this.isModalToDeleteSaving = true;
  }
  
  closeModalToDeleteSaving(){
    this.isModalToDeleteSaving = false;
    this.dataSavingToDelete = null!;
  }

  async deleteSaving(selectedSaving : SavingAccount){
    try{
      await this._firestore.deleteSavingAccount(this.uid, selectedSaving);
      toast.success("Cuenta de ahorro eliminada correctamente")
      this.closeModalToDeleteSaving();
      this.ngOnInit();
    }catch(error){
      toast.error("Error al eliminar presupuesto " + error)
      console.log(error);
    }
  }


}
