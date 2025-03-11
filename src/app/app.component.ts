import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import playerData from '../../public/assets/players.json';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  firstValueFrom,
  map,
  Observable,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AsyncPipe, isPlatformServer, JsonPipe } from '@angular/common';
import { CloudflareApiHelper } from './helpers/services/cloudflare-api-helper.service';
import { PlayerOption } from './helpers/types/player.types';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

type Transfer = {
  from: string;
  to: string;
  date: string;
  fee: string;
};

type TransferHistory = {
  [season: string]: Transfer[];
};

type CareerTimeline = {
  season: string;
  club: string;
};

type PlayerData = {
  player_id: number;
  name: string;
  birth_date: string;
  position: string;
  birth_place: string;
  age: string;
  transfer_history: TransferHistory;
  career_timeline: CareerTimeline[];
  clubs_played: string[];
  current_club: string;
};

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatOptionModule,
    ReactiveFormsModule,
    AsyncPipe,
    JsonPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'player-seeker';
  myControl = new FormControl<string | PlayerOption>('');
  options: PlayerOption[] = JSON.parse(JSON.stringify(playerData));
  filteredOptions$: Observable<PlayerOption[]> = new Observable();

  randomPlayerIndex = signal(Math.floor(Math.random() * this.options.length));
  randomPlayerIndex$ = toObservable(this.randomPlayerIndex);
  randomPlayer = signal<PlayerData | undefined>(undefined);
  randomPlayerHints = signal<string[]>([]);

  currentHints = signal<string[]>([]);

  playerScore = signal(100);
  cloudflareApiHelper = inject(CloudflareApiHelper);

  platformId = inject(PLATFORM_ID);

  constructor() {
    this.randomPlayerIndex$
      .pipe(
        takeUntilDestroyed(),
        switchMap((randomIndex) => {
          return this.cloudflareApiHelper.getPlayerData(
            this.options[randomIndex].player_id
          );
        }),
        tap((playerDataPayload) => {
          console.log(playerDataPayload.value);
          const playerData: PlayerData = JSON.parse(
            `${playerDataPayload.value}`
          );
          console.log(playerData);

          this.randomPlayer.set(playerData);
          const carrierTimelineHints = playerData.career_timeline.map(
            (timeline) =>
              `${timeline.season} sezon/sezonlarinda ${timeline.club}'te oynamıştır.`
          );
          this.randomPlayerHints.set([
            ...carrierTimelineHints,
            `Şu an ${playerData.current_club}'te oynamaktadır.`,
            `Doğum yeri ${playerData.birth_place}'dir.`,
            `Doğum tarihi ${playerData.birth_date}'dir.`,
            `Pozisyonu ${playerData.position}'dir.`,
            `Yaşı ${playerData.age}'dir.`,
            `Toplamda ${playerData.clubs_played.length} farklı kulüpte oynamıştır.`,
          ]);
        })
      )
      .subscribe();
  }

  getRandomPlayer() {
    const randomIndex = Math.floor(Math.random() * this.options.length);
    this.randomPlayerIndex.set(randomIndex);
    //remove the index from the options
    this.options.splice(randomIndex, 1);

    this.playerScore.update((score) => score + 100);
  }

  displayFn(user: PlayerData): string {
    return user && user.name ? user.name : '';
  }

  async getPlayerHint() {
    const randomPlayerHints = this.randomPlayerHints();

    if (randomPlayerHints.length === 0) {
      alert('Hint Kalmadi.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * randomPlayerHints.length);
    //get hint from randomPlayerHints then remove it from the list
    const hint = randomPlayerHints[randomIndex];
    randomPlayerHints.splice(randomIndex, 1);
    this.randomPlayerHints.set([...randomPlayerHints]);
    this.currentHints.update((hints) => [...hints, hint]);
    this.playerScore.update((score) => score - 5);
  }

  checkAnswer() {
    const selectedPlayer = this.myControl.value;
    const randomPlayer = this.randomPlayer();
    if (
      !selectedPlayer ||
      typeof selectedPlayer === 'string' ||
      !randomPlayer
    ) {
      return;
    }

    if (selectedPlayer.player_id === randomPlayer.player_id) {
      //show alert that the answer is correct
      alert('Correct Answer');
      this.getRandomPlayer();
      this.currentHints.set([]);
      this.myControl.reset();
    } else {
      this.playerScore.update((score) => score - 1);
    }
  }

  private _filter(name: string): PlayerOption[] {
    const filterValue = name.toLowerCase();

    return this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
  }
}
