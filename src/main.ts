import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { authInterceptor } from '../projects/shared/src/public-api';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
})
  .catch((err) => console.error(err));
