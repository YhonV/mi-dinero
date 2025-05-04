import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonButton, IonIcon, IonItem, IonInput } from '@ionic/angular/standalone'
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { trendingUpOutline } from 'ionicons/icons'; 
import { Budget, Category, User } from 'src/app/shared/models/interfaces';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { Auth } from '@angular/fire/auth';

Chart.register(...registerables);
@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  imports: [FormsModule, IonContent, IonButton, IonIcon, IonItem, IonInput, CommonModule]
})
export default class BudgetComponent  implements OnInit {

  @ViewChild('chartCanvas') private chartCanvas!: ElementRef;
  private chart: Chart | undefined;
  private _firestore = inject(FirestoreService);
  categoriasGasto: Category[] = [];
  uid: string = '';
  userData: User | null = null
  isModalOpen: boolean = false;
  amount: number = 0;
  categoriaSeleccionada: string = '';
  private _auth = inject(Auth)

  n : number = 0;

  constructor() { 
    addIcons({trendingUpOutline})
  }

  async ngOnInit() {
    this.categoriasGasto = await this._firestore.getCategoriesGastos()

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

  ngAfterViewInit() {
    this.createChart();
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        datasets: [{
          label: 'Presupuesto 2025',
          data: [1200, 1900, 3000, 5000, 2200, 3300],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false; 
  }

  async saveBudget(){
    if(!this.amount || !this.categoriaSeleccionada){
      toast.error("¡¡ Todos los campos son requeridos !!");
      return;
    }
    this.n += 1;
    const budget : Budget = {
    id: this.n,
    categoryId: this.categoriaSeleccionada,
    amount: this.amount
    }

    await this._firestore.createBudget(this.uid, budget)


  }

}
