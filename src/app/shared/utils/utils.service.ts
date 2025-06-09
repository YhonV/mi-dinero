import { inject, Injectable } from '@angular/core';
import { NavController, LoadingController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  private _navCtrl = inject(NavController);
  loadingCtrl = inject(LoadingController);

  loadingSpinner(){
    return this.loadingCtrl.create({
      spinner: 'crescent'
    });
  }

  async navigateTo(path: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Redirigiendo...',
      spinner: 'crescent'
    });
    await loading.present();
    setTimeout(async () => {
      this._navCtrl.navigateRoot(path);
      setTimeout(() => {
        loading.dismiss();
      }, 500); 
    }, 1000);
  }

  async navigateToWithoutLoading(path: string){
    this._navCtrl.navigateRoot(path);
  }  

  currencyFormatter({ currency, value }: { currency: string; value: number }) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      minimumFractionDigits: 0,
      currency
    }) 
    return formatter.format(value)
  }
}
