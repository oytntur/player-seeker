import {
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  StateKey,
  TransferState,
} from '@angular/core';
import { PlayerData, PlayerOption } from '../types/player.types';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../../environments/enviroment.base';

@Injectable({
  providedIn: 'root',
})
export class CloudflareApiHelper {
  environment = inject(ENVIRONMENT);

  private workerUrl = this.environment.apiUrl; // Cloudflare Worker URL'nizi buraya ekleyin

  constructor(private http: HttpClient) {
    console.log('CloudflareApiHelper initialized with URL:', this.workerUrl);
  }

  // Player verilerini almak için servis fonksiyonu
  getPlayerData(playerId: number): Observable<any> {
    const url = `${this.workerUrl}/players/${playerId}`;
    return this.http.get<any>(url);
  }

  getPlayerOptions(): Observable<any> {
    const url = `${this.workerUrl}/players`;
    return this.http.get<any>(url);
  }
}
