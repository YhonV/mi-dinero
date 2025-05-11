import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonButton, IonIcon, IonItem, IonInput } from '@ionic/angular/standalone'
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { trendingUpOutline, addOutline, filmOutline, carOutline, bulbOutline, restaurantOutline, fastFoodOutline, cashOutline, homeOutline, medkitOutline, shirtOutline, schoolOutline, barChartOutline, cartOutline, giftOutline } from 'ionicons/icons'; 
import { Budget, Category, User } from 'src/app/shared/models/interfaces';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { Auth } from '@angular/fire/auth';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
  private _auth = inject(Auth)

  categoriasGasto: Category[] = [];
  uid: string = '';
  userData: User | null = null
  isModalOpen: boolean = false;
  amount: number = 0;
  categoriaSeleccionada: string = '';
  budget : Budget[] = []
  hasBudget : boolean = false
  isLoading: boolean = true;

  constructor() { 
    addIcons({trendingUpOutline, addOutline, filmOutline,carOutline, bulbOutline, restaurantOutline, cashOutline,
      fastFoodOutline,
      homeOutline,   
      medkitOutline, 
      shirtOutline,
      schoolOutline, 
      barChartOutline, 
      cartOutline, 
      giftOutline })
  }

  async ngOnInit() {
    this.isLoading = true;
    this.categoriasGasto = await this._firestore.getCategoriesGastos()

    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.uid = user.uid;
        this.userData = await this._firestore.getUser(user["uid"]);
        await this.loadBudgets(this.uid);
      
        
        this.isLoading = false;
      } else{
        console.log("no user");
        this.userData = null;  
        this.isLoading = false;
      }
    })
  }

  currencyFormatter({ currency, value }: { currency: string; value: number }) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      minimumFractionDigits: 0,
      currency
    }) 
    return formatter.format(value)
  }

  async loadBudgets(uid : string){
    const allBudgets = await this._firestore.getBudget(uid);
    
    this.budget = allBudgets.map(budget => {
      let iconoCategoria: string;
      const category = this.categoriasGasto.find(cat => cat.nombre === budget.categoryId);
      iconoCategoria = category?.icono ?? 'default-icon';

      const montoFormateado =  this.currencyFormatter({
        currency: "CLP",
        value: budget.amount
      })
      return {
        ...budget, iconoCategoria, montoFormateado
      }
    })
    this.hasBudget = true;
    setTimeout(() => {
      if (this.budget.length > 0){
        this.createChart()
      } else{
        console.log('No hay presupuesto guardados')
      }
    }, 1000);
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.budget.length) {
      console.log('No hay datos para mostrar');
      return;
    }
  
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    const labels = this.budget.map(item => item.categoryId);
    const data = this.budget.map(item => item.amount);
  
    if (this.chart) {
      this.chart.destroy();
    }
  
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title:{
            display: true,
            text: "Presupuestos actuales"
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP'
                  }).format(context.parsed);
                }
                return label;
              }
            }
          },
          datalabels: {
            formatter: (value) => {
              return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
              }).format(value);
            },
            color: '#000',
            anchor: 'center',
            align: 'center',
            font: {
              weight: 'bold'
            }
          }
        }
      },
      plugins: [ChartDataLabels] // Add this line
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

    const budget : Budget = {
    id: new Date().getTime(),
    categoryId: this.categoriaSeleccionada,
    amount: this.amount
    }
    await this._firestore.createBudget(this.uid, budget)
    toast.success("Presupuesto guardado exitosamente")
    this.ngOnInit();
    this.closeModal();
  }

}
