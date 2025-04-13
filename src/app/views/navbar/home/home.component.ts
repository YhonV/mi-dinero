import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Category } from 'src/app/shared/models/interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export default class HomeComponent  implements OnInit {
  
  router = inject(Router);

  constructor() { }

  ngOnInit() {}
  isModalOpen: boolean = false;
  tipoSeleccionado: 'ingreso' | 'gasto' = 'ingreso';
  monto: number= 0;
  categoriaSeleccionada: string = '';
  defaultTipo: 'ingreso' | 'gasto' = 'ingreso';
  defaultMonto: number = 0;
  defaultCategoria: string = '';
  transactions: Transaction[] = [];

  // Categorías de ingresos
  categoriasIngreso: Category[] = [
    { id: 'salario', description: 'Salario', type: 'ingreso' },
    { id: 'inversiones', description: 'Inversiones', type: 'ingreso' },
    { id: 'ventas', description: 'Ventas', type: 'ingreso' },
    { id: 'regalos', description: 'Regalos recibidos', type: 'ingreso' },
    { id: 'otros_ingresos', description: 'Otros ingresos', type: 'ingreso' }
  ];

  // Categorías de gastos
  categoriasGasto: Category[] = [
    { id: 'comida', description: 'Alimentación', type: 'gasto' },
    { id: 'transporte', description: 'Transporte', type: 'gasto' },
    { id: 'vivienda', description: 'Vivienda', type: 'gasto' },
    { id: 'entretenimiento', description: 'Entretenimiento' , type: 'gasto'},
    { id: 'servicios', description: 'Servicios' , type: 'gasto'},
    { id: 'salud', description: 'Salud', type: 'gasto' },
    { id: 'ropa', description: 'Ropa y accesorios', type: 'gasto' },
    { id: 'educacion', description: 'Educación', type: 'gasto' },
    { id: 'otros_gastos', description: 'Otros gastos', type: 'gasto' }
  ];

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
    const nuevaTransaccion: Transaction = {
      id: Date.now().toString(),
      type: this.tipoSeleccionado,
      amount: this.monto,
      categoryId: this.categoriasIngreso.find(c => c.id === this.categoriaSeleccionada) || this.categoriasGasto.find(c => c.id === this.categoriaSeleccionada)!,
      date: new Date()
    };
    this.transactions.push(nuevaTransaccion);
    this.closeModal();
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
