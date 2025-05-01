import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone'
@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  imports: [IonContent]
})
export default class BudgetComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
