import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
providers: [
    // 2. MODIFICA ESTA LÍNEA ASÍ:
    provideRouter(
      routes, 
      withInMemoryScrolling({
        anchorScrolling: 'enabled',      // Permite bajar a los IDs
        scrollPositionRestoration: 'enabled' // Te lleva arriba cuando cambias de página
      })
    ),
    provideClientHydration()
  ]
};
