import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Category } from 'src/app/shared/models/interfaces';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export default class HomeComponent  implements OnInit {
  private _firestore = inject(FirestoreService);  
  router = inject(Router);

  constructor() { }

  ngOnInit() { this._firestore.initializeCategories()}
  isModalOpen: boolean = false;
  tipoSeleccionado: 'ingreso' | 'gasto' = 'ingreso';
  monto: number= 0;
  categoriaSeleccionada: string = '';
  defaultTipo: 'ingreso' | 'gasto' = 'ingreso';
  defaultMonto: number = 0;
  defaultCategoria: string = '';
  transactions: Transaction[] = [];
  

  

  resetForm() {
    this.tipoSeleccionado = this.defaultTipo;
    this.monto = this.defaultMonto;
    this.categoriaSeleccionada = this.defaultCategoria;
  }
  
  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false; 
    this.resetForm();  
  }

 

  guardarTransaccion(): void {
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


    this.thisTransaction();
    // Aquí agregarías la lógica para guardar la transacción
    console.log('Guardando transacción:', {
      tipo: this.tipoSeleccionado,
      monto: this.monto,
      categoria: this.categoriaSeleccionada
    });
  }

  thisTransaction(): void {
    // const nuevaTransaccion: Transaction = {
    //   id: Date.now().toString(),
    //   type: this.tipoSeleccionado,
    //   amount: this.monto,
    //   categoryId: this.categoriasIngreso.find(c => c.id === this.categoriaSeleccionada) || this.categoriasGasto.find(c => c.id === this.categoriaSeleccionada)!,
    //   date: new Date()
    // };
    // this.transactions.push(nuevaTransaccion);
    // this.closeModal();
  }

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
