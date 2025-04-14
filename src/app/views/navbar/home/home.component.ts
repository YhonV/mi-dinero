import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Category, User } from 'src/app/shared/models/interfaces';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Auth } from '@angular/fire/auth';


@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export default class HomeComponent  implements OnInit {
  isModalOpen: boolean = false;
  tipoSeleccionado: 'ingreso' | 'gasto' = 'ingreso';
  monto: number= 0;
  categoriaSeleccionada: string = '';
  descripcion: string = '';
  transactions: Transaction[] = [];
  categoriasIngreso: Category[] = [];
  categoriasGasto: Category[] = [];
  uid: string = '';

  private _firestore = inject(FirestoreService);  
  router = inject(Router);
  private _auth = inject(Auth)
  userData: User | null = null
  
  constructor() {}

  async ngOnInit() {  
    this.categoriasGasto = await this._firestore.getCategoriesGastos()
    this.categoriasIngreso = await this._firestore.getCategoriesIngresos()

    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.uid = user.uid;
        this.userData = await this._firestore.getUser(user["uid"]);
      } else{
        console.log("no user");
        this.userData = null;  
      }
    })
  }

  // async loadTransactions() {
  //   const user = this._auth.currentUser;
  //   if (user){
  //     const transactions = await this._firestore
  //   }
  // }


  // resetForm() {
  //   this.tipoSeleccionado = this.defaultTipo;
  //   this.monto = this.defaultMonto;
  //   this.categoriaSeleccionada = this.defaultCategoria;
  // }
  
  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false; 
     
  }

 
  async guardarTransaccion(): Promise<void> {
    if (this.monto <= 0 || this.categoriaSeleccionada === '') {
      console.error('Por favor, completa todos los campos correctamente.');
      return;
    }

    if (this.tipoSeleccionado === 'gasto'){
      const saldoActual = this.calcularSaldo();
      if (this.monto > saldoActual){
        alert('No puedes gastar más de lo que tienes. Tu saldo actual es: ' + saldoActual);
        return;
      }
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: this.tipoSeleccionado,
      amount: this.monto,
      categoryId: this.categoriaSeleccionada,
      date: new Date()
    }
    await this._firestore.createTransaction(this.uid, transaction)


    // this.thisTransaction();
    // Aquí agregarías la lógica para guardar la transacción
    console.log('Guardando transacción:', {
      tipo: this.tipoSeleccionado,
      monto: this.monto,
      categoria: this.categoriaSeleccionada
    });
  }





  // thisTransaction(): void {
  //   // const nuevaTransaccion: Transaction = {
  //   //   id: Date.now().toString(),
  //   //   type: this.tipoSeleccionado,
  //   //   amount: this.monto,
  //   //   categoryId: this.categoriasIngreso.find(c => c.id === this.categoriaSeleccionada) || this.categoriasGasto.find(c => c.id === this.categoriaSeleccionada)!,
  //   //   date: new Date()
  //   // };
  //   // this.transactions.push(nuevaTransaccion);
  //   // this.closeModal();
  // }

  calcularIngresos(): number{
    return this.transactions.reduce((total, t) =>
      t.type === "ingreso" ? total + t.amount : total, 0);
  }

  calcularGastos(): number {
    return this.transactions.reduce((total, t) =>
      t.type === "gasto" ? total + t.amount : total, 0);
  }


  calcularSaldo(): number {
    return this.transactions.reduce((saldo, t) =>
      t.type === "ingreso" ? saldo + t.amount : saldo - t.amount, 0);
  }

}
