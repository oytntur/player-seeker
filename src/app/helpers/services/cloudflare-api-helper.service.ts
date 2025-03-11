import {
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  StateKey,
  TransferState,
} from '@angular/core';
import { PlayerData } from '../types/player.types';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CloudflareApiHelper {
  private workerUrl = 'https://kv-tutorial.turoytun0.workers.dev'; // Cloudflare Worker URL'nizi buraya ekleyin

  constructor(private http: HttpClient) {}

  // Player verilerini almak için servis fonksiyonu
  getPlayerData(playerId: number): Observable<any> {
    const url = `${this.workerUrl}?id=${playerId}`;
    return this.http.get<any>(url);
  }
}
