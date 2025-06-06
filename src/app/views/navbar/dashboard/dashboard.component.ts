import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { IonContent, IonTitle, IonButtons, IonBackButton, IonToolbar, IonHeader, IonCardContent, IonSpinner, IonCard, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone'
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Category, User } from 'src/app/shared/models/interfaces';
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [IonContent, IonTitle, IonButtons, IonBackButton, IonToolbar, IonHeader, CommonModule, FormsModule, IonCardContent, IonSpinner, IonCard,  IonSegment, IonSegmentButton, IonLabel]
})
export default class DashboardComponent implements OnInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private _firestore = inject(FirestoreService);
  private _auth = inject(Auth);
  chart: Chart | null = null;
  
  uid: string = '';
  userData: User | null = null;
  periodo = 'mes';
  tipo = 'gastos';
  loading = false;

  constructor() { }

  async ngOnInit() {
    this._auth.onAuthStateChanged(async user => {
      if (user) {
        this.uid = user.uid;
        this.userData = await this._firestore.getUser(user["uid"]);
        console.log(this.uid);
        await this.graficoPorPeriodo();
      } else {
        console.log("no user");
        this.userData = null;
      }
    });
  }

  async graficoPorPeriodo() {
    if (!this.uid) return;

    this.loading = true;
    let hoy = new Date();
    let desde: Date;

    if (this.periodo === 'semana') {
      desde = new Date();
      desde.setDate(hoy.getDate() - 7);
    } else if (this.periodo === 'mes') {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      hoy = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    } else if (this.periodo === 'anio') {
      desde = new Date(hoy.getFullYear(), 0, 1);
      hoy = new Date(hoy.getFullYear(), 11,31);
    } else {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }

    if (this.tipo === 'gastos') {
      const gastos = await this._firestore.getGastosCategoria(this.uid, desde, hoy);
      this.cargarGrafico(gastos, desde, hoy);
    } else if (this.tipo === 'ingresos') {
      const ingresos = await this._firestore.getIngresosCategoria(this.uid, desde, hoy);
      this.cargarGrafico(ingresos, desde, hoy);
    } else if (this.tipo === 'comparativo') {
      const gastos = await this._firestore.getGastosPorDia(this.uid, desde, hoy);
      const ingresos = await this._firestore.getIngresosPorDia(this.uid, desde, hoy);
      this.cargarGraficoComparativo(gastos, ingresos);
    }
    this.loading = false;
  }

  private cargarGrafico(data: { [cat: string]: number }, desde: Date, hoy: Date) {
    // Destruir gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = Object.keys(data);
    const valores = Object.values(data);

    // Esperar un tick para asegurar que el canvas esté disponible
    setTimeout(() => {
      if (this.chartCanvas?.nativeElement) {
        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (ctx) {
          const config: ChartConfiguration = {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: this.tipo === 'gastos' ? 'Gastos (CLP)' : 'Ingresos (CLP)',
                data: valores,
                backgroundColor: [
                  'rgba(231, 76, 60, 0.8)',
                  'rgba(52, 152, 219, 0.8)', 
                  'rgba(46, 204, 113, 0.8)',
                  'rgba(155, 89, 182, 0.8)',
                  'rgba(241, 196, 15, 0.8)',
                  'rgba(230, 126, 34, 0.8)'
                ],
                borderColor: [
                  'rgba(231, 76, 60, 1)',
                  'rgba(52, 152, 219, 1)',
                  'rgba(46, 204, 113, 1)',
                  'rgba(155, 89, 182, 1)',
                  'rgba(241, 196, 15, 1)',
                  'rgba(230, 126, 34, 1)'
                ],
                borderWidth: 1,
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: `${this.tipo === 'gastos' ? 'Gastos' : 'Ingresos'} por Categoría`,
                  font: {
                    size: 16,
                    family: 'Roboto, sans-serif'
                  },
                  color: '#2c3e50'
                },
                subtitle: {
                  display: true,
                  text: `Del ${desde.toLocaleDateString()} al ${hoy.toLocaleDateString()}`,
                  font: {
                    size: 12,
                    family: 'Roboto, sans-serif'
                  },
                  color: '#2c3e50'
                },
                legend: {
                  display: false
                },
                tooltip: {
                  backgroundColor: '#ffffff',
                  titleColor: '#2c3e50',
                  bodyColor: '#2c3e50',
                  borderColor: '#dee2e6',
                  borderWidth: 1,
                  cornerRadius: 8,
                  callbacks: {
                    label: function(context) {
                      return `${context.parsed.y.toLocaleString()} CLP`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  ticks: {
                    color: '#5a6c7d',
                    font: {
                      size: 10,
                      family: 'Roboto, sans-serif'
                    },
                    maxRotation: 45,
                    minRotation: 45
                  },
                  grid: {
                    display: false
                  }
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#5a6c7d',
                    font: {
                      size: 10,
                      family: 'Roboto, sans-serif'
                    },
                    callback: function(value) {
                      return value.toLocaleString();
                    }
                  },
                  grid: {
                    color: '#e9ecef'
                  },
                  title: {
                    display: true,
                    text: 'Monto (CLP)',
                    color: '#5a6c7d',
                    font: {
                      size: 12
                    }
                  }
                }
              },
              layout: {
                padding: {
                  top: 20,
                  bottom: 20
                }
              }
            }
          };

          this.chart = new Chart(ctx, config);
        }
      }
    }, 100);
  }

  private cargarGraficoComparativo(gastos: { [fecha: string]: number }, ingresos: { [fecha: string]: number }) {
    if (this.chart) {
      this.chart.destroy();
    }

    const fechas = Array.from(new Set([
      ...Object.keys(gastos),
      ...Object.keys(ingresos)
    ])).sort();

    const gastosData = fechas.map(fecha => gastos[fecha] || 0);
    const ingresosData = fechas.map(fecha => ingresos[fecha] || 0);
    const labels = fechas.map(fecha => new Date(fecha).toLocaleDateString('es-CL', { 
      day: 'numeric', 
      month: 'long' 
    }));

    setTimeout(() => {
      if (this.chartCanvas?.nativeElement) {
        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (ctx) {
          const config: ChartConfiguration = {
            type: 'line',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Gastos',
                  data: gastosData,
                  borderColor: '#e74c3c',
                  backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  tension: 0.4,
                  fill: false,
                  pointBackgroundColor: '#e74c3c',
                  pointBorderColor: '#e74c3c',
                  pointRadius: 4
                },
                {
                  label: 'Ingresos',
                  data: ingresosData,
                  borderColor: '#3498db',
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  tension: 0.4,
                  fill: false,
                  pointBackgroundColor: '#3498db',
                  pointBorderColor: '#3498db',
                  pointRadius: 4
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                intersect: false,
                mode: 'index'
              },
              plugins: {
                title: {
                  display: true,
                  text: `Ingresos VS. Gastos`,
                  font: {
                    size: 16,
                    family: 'Roboto, sans-serif'
                  },
                  color: '#2c3e50'
                },
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    usePointStyle: true,
                    font: {
                      family: 'Roboto, sans-serif'
                    },
                    color: '#2c3e50'
                  }
                },
                tooltip: {
                  backgroundColor: '#ffffff',
                  titleColor: '#2c3e50',
                  bodyColor: '#2c3e50',
                  borderColor: '#dee2e6',
                  borderWidth: 1,
                  cornerRadius: 8,
                  callbacks: {
                    label: function(context) {
                      return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} CLP`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  ticks: {
                    color: '#5a6c7d',
                    font: {
                      size: 10,
                      family: 'Roboto, sans-serif'
                    },
                    maxRotation: 45,
                    minRotation: 45
                  },
                  grid: {
                    color: '#e9ecef'
                  }
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#5a6c7d',
                    font: {
                      size: 10,
                      family: 'Roboto, sans-serif'
                    },
                    callback: function(value) {
                      return value.toLocaleString();
                    }
                  },
                  grid: {
                    color: '#e9ecef'
                  },
                  title: {
                    display: true,
                    text: 'Monto (CLP)',
                    color: '#5a6c7d',
                    font: {
                      size: 12
                    }
                  }
                }
              },
              layout: {
                padding: {
                  top: 20,
                  bottom: 20
                }
              }
            }
          };

          this.chart = new Chart(ctx, config);
        }
      }
    }, 100);
  }

  async onPeriodoChange(value: any) {
    this.periodo = value
    if (this.uid) {
      await this.graficoPorPeriodo();
    } else {
      console.warn('UID aún no disponible para actualizar el gráfico');
    }
  }

  async onTipoChange(value: any) {
    if (!value) return;
    this.tipo = String(value);
    this.tipo = value;
    if (this.uid) {
      await this.graficoPorPeriodo();
    } else {
      console.warn('UID aún no disponible para actualizar el gráfico');
    }
  }

  // private getPeriodoTitulo(): string {
  //   switch (this.periodo) {
  //     case 'semana': return 'Última semana';
  //     case 'mes': return 'Este mes';
  //     case 'anio': return 'Este año';
  //     default: return 'Este mes';
  //   }
  // }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}