import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private saldoActual = new BehaviorSubject<number>(0);

  getSaldo(): Observable<number> {
    return this.saldoActual.asObservable();
  }

  updateSaldo(saldo: number): void {
    this.saldoActual.next(saldo);
  }
}
