import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Categoria } from 'src/app/shared/models/interfaces';


@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export default class HomeComponent  implements OnInit {

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
  categoriasIngreso: Categoria[] = [
    { id: 'salario', nombre: 'Salario' },
    { id: 'inversiones', nombre: 'Inversiones' },
    { id: 'ventas', nombre: 'Ventas' },
    { id: 'regalos', nombre: 'Regalos recibidos' },
    { id: 'otros_ingresos', nombre: 'Otros ingresos' }
  ];

  // Categorías de gastos
  categoriasGasto: Categoria[] = [
    { id: 'comida', nombre: 'Alimentación' },
    { id: 'transporte', nombre: 'Transporte' },
    { id: 'vivienda', nombre: 'Vivienda' },
    { id: 'entretenimiento', nombre: 'Entretenimiento' },
    { id: 'servicios', nombre: 'Servicios' },
    { id: 'salud', nombre: 'Salud' },
    { id: 'ropa', nombre: 'Ropa y accesorios' },
    { id: 'educacion', nombre: 'Educación' },
    { id: 'otros_gastos', nombre: 'Otros gastos' }
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
      category: this.categoriasIngreso.find(c => c.id === this.categoriaSeleccionada) || this.categoriasGasto.find(c => c.id === this.categoriaSeleccionada)!,
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
