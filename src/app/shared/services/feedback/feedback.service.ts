import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private _firestore = inject(Firestore);
  constructor() { }

  sendFeedback(subject : string, message : string, rating : number){
    const pathFeedback = addDoc(collection(this._firestore, "feedback"), {
      subject, message, rating
    })
  }
}
