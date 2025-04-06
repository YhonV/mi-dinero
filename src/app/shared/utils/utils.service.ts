import { inject, Injectable } from '@angular/core';
import { NavController, LoadingController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  private _navCtrl = inject(NavController);
  loadingCtrl = inject(LoadingController);

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
}
