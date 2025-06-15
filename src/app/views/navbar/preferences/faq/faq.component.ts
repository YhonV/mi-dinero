import { Component, OnInit } from '@angular/core';
import { IonContent, IonTitle, IonBackButton, IonButtons, IonToolbar, IonHeader, IonAccordionGroup, IonAccordion, IonItem, IonLabel }from '@ionic/angular/standalone';
import { FAQ } from 'src/app/shared/models/interfaces';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  imports: [CommonModule,IonContent, IonTitle, IonBackButton, IonButtons, IonToolbar, IonHeader, IonAccordionGroup, IonAccordion, IonItem, IonLabel]
})
export class FaqComponent implements OnInit {
  faqs: FAQ[] = [];

  constructor(private _firestore: FirestoreService) {}

  async ngOnInit() {
    try {
      this.faqs = await this._firestore.getFAQs();
      console.log(this.faqs)
    } catch (error) {
      console.error('Error cargando FAQs:', error);
    }
  }

}
