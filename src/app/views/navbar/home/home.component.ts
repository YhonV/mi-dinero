import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Category, User } from 'src/app/shared/models/interfaces';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Auth } from '@angular/fire/auth';
import { IonIcon, IonContent }   from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, fastFoodOutline, carOutline, homeOutline, filmOutline, bulbOutline, medkitOutline, shirtOutline, schoolOutline, barChartOutline, cartOutline, giftOutline } from 'ionicons/icons';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, IonIcon, IonContent],
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
  categoryIcon : string | undefined;
  private _firestore = inject(FirestoreService);  
  router = inject(Router);
  private _auth = inject(Auth)
  userData: User | null = null
  currentPage: number = 1;
  itemsPerPage: number = 5;
  
  constructor() {
    addIcons({
      cashOutline,
      fastFoodOutline,
      carOutline,
      homeOutline, 
      filmOutline, 
      bulbOutline, 
      medkitOutline, 
      shirtOutline,
      schoolOutline, 
      barChartOutline, 
      cartOutline, 
      giftOutline
    })
  }

  async ngOnInit() {  
    this.categoriasGasto = await this._firestore.getCategoriesGastos()
    this.categoriasIngreso = await this._firestore.getCategoriesIngresos()

    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.uid = user.uid;
        this.userData = await this._firestore.getUser(user["uid"]);
        this.loadTransactions();
      } else{
        console.log("no user");
        this.userData = null;  
      }
    })

  }

  async loadTransactions(){
    if (this.uid){
      const rawTransactions = await this._firestore.getTransactions(this.uid);
      this.transactions = rawTransactions.map(transaction => {
        let iconoCategoria: string;
  
        if (transaction.type === 'ingreso'){
          const category = this.categoriasIngreso.find(cat => cat.nombre === transaction.categoryId);
          iconoCategoria = category?.icono ?? 'default-icon';
          console.log( iconoCategoria);
        } else {
          const category = this.categoriasGasto.find(cat => cat.nombre === transaction.categoryId);
          iconoCategoria = category?.icono ?? 'default-icon';
          console.log( iconoCategoria);
        }
        
        return {
          ...transaction,
          categoryIcon: iconoCategoria
        };
      });
    }
  }

  
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
        toast.error('❌ No puedes gastar más de lo que tienes. Tu saldo actual es: $' + saldoActual);        
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
    toast.success('✅ Transacción creada exitosamente')

    await this.loadTransactions();
    this.monto = 0;
    this.categoriaSeleccionada = ''
    this.closeModal()
  }


  get sortedTransactions(): Transaction[]{
    return this.transactions.slice().sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
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

  getPageCount(): number {
    return Math.ceil(this.transactions.length / this.itemsPerPage);
  }

  // Función para generar el array de paginación (1, 2, ..., n)
  getPaginationArray(): (number | string)[] {
    const pageCount = this.getPageCount();
    
    // Si hay pocas páginas, mostrar todas
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    
    // Si hay muchas páginas, mostrar 1, 2, ..., n-1, n
    const pages: (number | string)[] = [];
    
    // Siempre mostrar la primera página
    pages.push(1);
    
    // Mostrar páginas alrededor de la página actual
    if (this.currentPage > 2) {
      pages.push(2);
    }
    
    if (this.currentPage > 3) {
      pages.push('...');
    }
    
    // Páginas cercanas a la actual
    for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(pageCount - 1, this.currentPage + 1); i++) {
      if (i > 2 && i < pageCount - 1) {
        pages.push(i);
      }
    }
    
    if (this.currentPage < pageCount - 2) {
      pages.push('...');
    }
    
    if (this.currentPage < pageCount - 1) {
      pages.push(pageCount - 1);
    }
    
    // Siempre mostrar la última página
    pages.push(pageCount);
    
    return pages;
  }

  // Función para manejar el cambio de página
  changePage(page: string | number) {
    // Validar que la página esté dentro del rango válido
    if (typeof page === 'string') {
      return;
    }
    
    // Validar que la página esté dentro del rango válido
    if (page < 1 || page > this.getPageCount()) {
      return;
    }
    
    this.currentPage = page;
  }

  get paginatedTransactions(): Transaction[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.sortedTransactions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  

  


}
