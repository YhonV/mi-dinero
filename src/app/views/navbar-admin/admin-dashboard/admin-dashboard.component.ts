import { Component, OnInit } from '@angular/core';
import {
  IonContent, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel, 
  IonIcon, 
  IonAlert
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Logs, User } from 'src/app/shared/models/interfaces';
import { toast } from 'ngx-sonner';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  imports: [
    IonContent, 
    CommonModule, 
    IonSegment, 
    IonSegmentButton, 
    IonLabel, 
    FormsModule, 
    IonIcon, 
    IonAlert
  ]
})
export class AdminDashboardComponent  implements OnInit {
  selectedSegment: string = 'usuarios';
  userData: User[] = []
  logs: Logs[] = []
  private selectedUser: User | null = null;

  constructor(private _firestoreService: FirestoreService, private alertController: AlertController) {
    addIcons({
      trashOutline
    })
   }

  ngOnInit() {
    this.getAllUsers();
    this.getAllLogs();
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async getAllUsers(){
    this.userData = await this._firestoreService.getGenericCollection<User>("users");

    console.log(this.userData)
  }

  async getAllLogs() {
    try {
      const logsData = await this._firestoreService.getGenericCollection<Logs>("logs");
      console.log(logsData)
      this.logs = logsData.map(log => {
        const fechaDate = log.fecha?.toDate?.() || new Date();

        const dia = String(fechaDate.getDate()).padStart(2, '0');
        const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
        const año = fechaDate.getFullYear();
        const horas = String(fechaDate.getHours()).padStart(2, '0');
        const minutos = String(fechaDate.getMinutes()).padStart(2, '0');
        
        return {
          ...log,
          fecha: fechaDate,
          fechaFormateada: `${dia}-${mes}-${año} ${horas}:${minutos}`
        };
      });

      this.logs.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    } catch (error) {
      console.error('Error al obtener logs:', error);
    }
  }


  async deleteUser(user: User) {
      const userId = (user as any).id;
      try {
          await this._firestoreService.deleteDocument(userId, 'users');
          await this.getAllUsers();
          toast.success('Usuario eliminado correctamente');
      } catch (error) {
          console.error('Error al eliminar usuario:', error);
          toast.error('Error al eliminar usuario');
      }
  }

  async deleteLog(log: Logs){
    const logId = (log as any).id;
    try {
        await this._firestoreService.deleteDocument(logId, 'logs');
        await this.getAllLogs();
        toast.success('Log eliminado correctamente');
    } catch (error) {
          console.error('Error al eliminar log:', error);
          toast.error('Error al eliminar log');
      }
  }

  async prepareDeleteUser(user: User) {
    const alert = await this.alertController.create({
      header: '¿Estás seguro?',
      message: `¿Deseas eliminar al usuario <strong>${user.email}</strong>?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteUser(user);
          }
        }
      ]
    });

    await alert.present();
  }

    async prepareDeleteLog(log: Logs) {
    const alert = await this.alertController.create({
      header: '¿Estás seguro?',
      message: `¿Deseas eliminar aste log?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteLog(log);
          }
        }
      ]
    });

    await alert.present();
  }



}
