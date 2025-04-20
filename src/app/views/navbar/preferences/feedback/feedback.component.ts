import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonTextarea,
  IonItem,
  IonInput,
  IonLabel,
  IonIcon,
  IonContent,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonToolbar,
  IonHeader,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  paperPlane,
  star,
  starOutline,
  call,
  mail,
  chatbubbles,
  headset,
  paperPlaneOutline,
  headsetOutline,
} from 'ionicons/icons';
import { toast } from 'ngx-sonner';
import { FormFeedback } from 'src/app/shared/models/interfaces';
import { FeedbackService } from 'src/app/shared/services/feedback/feedback.service';
@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  imports: [
    IonButton,
    IonTextarea,
    IonItem,
    IonInput,
    IonLabel,
    IonIcon,
    IonContent,
    IonTitle,
    IonBackButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    ReactiveFormsModule,
    CommonModule
  ],
})

export default class FeedbackComponent implements OnInit {

  private _feedbackService = inject(FeedbackService)
  private _formBuilder = inject(FormBuilder);
  stars: number[] = [1,2,3,4,5];
  rating: number = 1;
  form = this._formBuilder.group<FormFeedback>({
    subject: this._formBuilder.control('', [Validators.required]),
    message: this._formBuilder.control('', [Validators.required]),
  })

  constructor() {
    addIcons({
      paperPlane,
      star,
      starOutline,
      call,
      mail,
      chatbubbles,
      headset,
      paperPlaneOutline,
      headsetOutline,
    });
  }

  ngOnInit() {}

  setRating(value : number){
    this.rating = value;
  }

  submit(){
    if(this.form.invalid){
      console.log(this.form.value)
      toast.error("Formulario inválido");
      return;
    }
    const { subject, message } = this.form.value;
    try{
      if (!subject || !message) return;
      toast.success("¡Muchas gracias por ayudarnos a crecer! 🙂‍↕️")
      this._feedbackService.sendFeedback(subject, message, this.rating);
      this.form.reset();
      this.rating = 1;
    }catch(error){
      console.log(error)
    }
  }
}
