import { Component, OnInit } from '@angular/core';
import {
  IonContent, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel, 
  IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Feedback, Logs, User } from 'src/app/shared/models/interfaces';
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
    IonIcon
  ]
})
export class AdminDashboardComponent  implements OnInit {
  selectedSegment: string = 'usuarios';
  userData: User[] = []
  logs: Logs[] = []
  feedbacks: Feedback[] = []

  constructor(private _firestoreService: FirestoreService, private alertController: AlertController) {
    addIcons({
      trashOutline
    })
   }

  ngOnInit() {
    this.getAllUsers();
    this.getAllLogs();
    this.getFeedbacks();
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async getAllUsers(){
    this.userData = await this._firestoreService.getGenericCollection<User>("users");
  }

  async getFeedbacks(){
    try{
      const feedbackData = await this._firestoreService.getGenericCollection<Feedback>("feedback");
      this.feedbacks = feedbackData
      console.log(this.feedbacks)
    } catch(e){
      throw new Error("Error al obtener los feedbacks" + e);
    }
  }

  async getAllLogs() {
    try {
      const logsData = await this._firestoreService.getGenericCollection<Logs>("logs");
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

    async deleteFeedback(feedback: Feedback){
    const feedbackId = (feedback as any).id;
    try {
        await this._firestoreService.deleteDocument(feedbackId, 'feedback');
        await this.getFeedbacks();
        toast.success('Feedback eliminado correctamente');
    } catch (error) {
          console.error('Error al eliminar feedback:', error);
          toast.error('Error al eliminar feedback');
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
      message: `¿Deseas eliminar este log?`,
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

  async prepareDeleteFeedback(feedback: Feedback) {
    const alert = await this.alertController.create({
      header: '¿Estás seguro?',
      message: `¿Deseas eliminar este feedback?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteFeedback(feedback);
          }
        }
      ]
    });

    await alert.present();
  }




}
