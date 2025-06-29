import { Component, OnInit } from '@angular/core';
import {
  IonContent, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel, 
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline, closeOutline, star } from 'ionicons/icons';
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
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton
  ]
})
export class AdminDashboardComponent  implements OnInit {
  selectedSegment: string = 'usuarios';
  userData: User[] = []
  logs: Logs[] = []
  feedbacks: Feedback[] = []
  isModalToDeleteUser : boolean = false;
  isModalToDeleteLog: boolean = false;
  isModalToDeleteFeedback: boolean = false;
  userToDelete: any;
  logToDelete: any;
  feedbackToDelete: any;
  rating: number = 1;

  constructor(private _firestoreService: FirestoreService, private alertController: AlertController) {
    addIcons({
      trashOutline,
      closeOutline,
      star
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


  async deleteUser() {
      let user = this.userToDelete
      const userId = (user as any).id;
      try {
          await this._firestoreService.deleteDocument(userId, 'users');
          toast.success('Usuario eliminado correctamente');
          this.closeModalToDeleteUser();
          await this.getAllUsers();
      } catch (error) {
          console.error('Error al eliminar usuario:', error);
          toast.error('Error al eliminar usuario');
      }
  }

  async deleteLog(){
    let log = this.logToDelete;
    const logId = (log as any).id;
    try {
        await this._firestoreService.deleteDocument(logId, 'logs');
        toast.success('Log eliminado correctamente');
        this.closeModalToDeleteLog();
        await this.getAllLogs();
    } catch (error) {
          console.error('Error al eliminar log:', error);
          toast.error('Error al eliminar log');
      }
  }

  async deleteFeedback(){
    let feedback = this.feedbackToDelete;
    const feedbackId = (feedback as any).id;
    try {
        await this._firestoreService.deleteDocument(feedbackId, 'feedback');
        toast.success('Feedback eliminado correctamente');
        this.closeModalToDeleteFeedback();
        await this.getFeedbacks();
    } catch (error) {
          console.error('Error al eliminar feedback:', error);
          toast.error('Error al eliminar feedback');
      }
  }

  openModalToDeleteUser(user : User){
    this.isModalToDeleteUser = true;
    this.userToDelete = user;
  }
  
  closeModalToDeleteUser(){
    this.isModalToDeleteUser = false;
    this.userToDelete = null!;
  }

  openModalToDeleteLog(log : Logs){
    this.isModalToDeleteLog = true;
    this.logToDelete = log;
  }

  closeModalToDeleteLog(){
    this.isModalToDeleteLog = false;
    this.logToDelete = null;
  }

  openModalToDeleteFeedback(feedback : Feedback){
    this.isModalToDeleteFeedback = true;
    this.feedbackToDelete = feedback;
  }

  closeModalToDeleteFeedback(){
    this.isModalToDeleteFeedback = false;
    this.feedbackToDelete = null;
  }

  getStarRating(value: number): string {
    const maxStars = 5;
    const fullStar = '★';
    const emptyStar = '☆';

    return fullStar.repeat(value) + emptyStar.repeat(maxStars - value);
  }
}
