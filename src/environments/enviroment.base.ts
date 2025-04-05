import { InjectionToken } from '@angular/core';

export interface Enviroment {
  production: boolean;
  apiUrl: string;
}

export const ENVIRONMENT = new InjectionToken<Enviroment>(
  'Environment for frontend projects'
);
