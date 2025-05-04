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
  categoriasGasto: Category[] = [];
  uid: string = '';
  userData: User | null = null
  isModalOpen: boolean = false;
  amount: number = 0;
  categoriaSeleccionada: string = '';
  private _auth = inject(Auth)
  budget : Budget[] = []
  n : number = 0;
  nombre = ''
  constructor() { 
    addIcons({trendingUpOutline})
  }

  async ngOnInit() {
    this.categoriasGasto = await this._firestore.getCategoriesGastos()
    
    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.uid = user.uid;
        this.userData = await this._firestore.getUser(user["uid"]);
        this.budget = await this._firestore.getBudget(this.uid);
        console.log('Budget cargado ' + JSON.stringify(this.budget));

        setTimeout(() => {
          if (this.budget.length > 0){
            this.createChart()
          } else{
            console.log('No hay presupuesto guardados')
          }
        }, 1000);
        
      } else{
        console.log("no user");
        this.userData = null;  
      }
    })
  }

  ngAfterViewInit() {
    
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
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Presupuesto por categoría',
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
            position: 'bottom'
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
          // Add this new section to display data labels
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
    this.n += 1;
    const budget : Budget = {
    id: this.n,
    categoryId: this.categoriaSeleccionada,
    amount: this.amount
    }

    await this._firestore.createBudget(this.uid, budget)

  }

}
