import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private presupuestoActualizado = new Subject<void>();
  presupuestoActualizado$ = this.presupuestoActualizado.asObservable();

  notificarCambio() {
    this.presupuestoActualizado.next();
  }

}
