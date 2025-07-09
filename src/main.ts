import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, initializeAuth, indexedDBLocalPersistence } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { Capacitor } from '@capacitor/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from './environments/environment.prod';


const firebaseConfig = environment.firebase;


bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'ios' }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    
    // --- CONFIGURACIÓN DE FIREBASE CORREGIDA ---
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    
    provideAuth(() => {
      // En una plataforma nativa (iOS/Android), usa initializeAuth con persistencia específica
      if (Capacitor.isNativePlatform()) {
        return initializeAuth(getApp(), {
          persistence: indexedDBLocalPersistence
        });
      }
      // En la web, usa la configuración por defecto
      return getAuth();
    }),
    
    provideFirestore(() => getFirestore()),
  ],
});
