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

const firebaseConfig = {
  projectId: 'mi-dinero-58798',
  appId: '1:222243591802:web:9ce8ffe671eabb93e74dc3',
  storageBucket: 'mi-dinero-58798.firebasestorage.app',
  apiKey: 'AIzaSyBuJaIbR-IP8z7KkrRGLT-5SzQim0SxaD4',
  authDomain: 'mi-dinero-58798.firebaseapp.com',
  messagingSenderId: '222243591802',
};

bootstrapApplication(AppComponent, {
  providers: [
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
