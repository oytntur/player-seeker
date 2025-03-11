import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
// import playerData from '../../public/assets/players.json';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, map, Observable, startWith } from 'rxjs';
import { AsyncPipe, isPlatformServer, JsonPipe } from '@angular/common';
import Cloudflare from 'cloudflare';

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
  myControl = new FormControl<string | PlayerData>('');
  // options: PlayerData[] = JSON.parse(JSON.stringify(playerData));
  options: PlayerData[] = [];
  filteredOptions$: Observable<PlayerData[]> = new Observable();

  randomPlayer = signal<PlayerData | undefined>(undefined);
  randomPlayerHints = signal<string[]>([]);

  currentHints = signal<string[]>([]);

  playerScore = signal(0);

  cloudflareClient = new Cloudflare({
    apiToken: 'xRbfaYuP7PAFrF4LE7GVyL2j7turZKC98wWTvIuo',
  });

  platformId = inject(PLATFORM_ID);

  constructor() {
    // this.filteredOptions$ = this.myControl.valueChanges.pipe(
    //   startWith(''),
    //   map((value) => {
    //     const name = typeof value === 'string' ? value : value?.name;
    //     return name ? this._filter(name as string) : this.options.slice();
    //   })
    // );
    // this.getRandomPlayer();

    if (isPlatformServer(this.platformId)) {
      console.log('getting data from cloudflare testing ');
      fetch(
        'https://api.cloudflare.com/client/v4/accounts/3178c0d2061751d76bd2ec9ebbf13921/storage/kv/namespaces/b41f8509cf73416e8b71cafff02fd96e/values/players/5110',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer xRbfaYuP7PAFrF4LE7GVyL2j7turZKC98wWTvIuo',
            mode: 'no-cors',
          },
        }
      )
        .then((response) => response.json())
        .then((data) => console.log(data));
    }

    this.testGetData();
  }

  getRandomPlayer() {
    const randomIndex = Math.floor(Math.random() * this.options.length);
    const randomPlayer = this.options[randomIndex];
    this.randomPlayer.set(randomPlayer);
    this.playerScore.update((score) => score + 100);
    const carrierTimelineHints = randomPlayer.career_timeline.map(
      (timeline) =>
        `${timeline.season} sezon/sezonlarinda ${timeline.club}'te oynamıştır.`
    );
    this.randomPlayerHints.set([
      ...carrierTimelineHints,
      `Şu an ${randomPlayer.current_club}'te oynamaktadır.`,
      `Doğum yeri ${randomPlayer.birth_place}'dir.`,
      `Doğum tarihi ${randomPlayer.birth_date}'dir.`,
      `Pozisyonu ${randomPlayer.position}'dir.`,
      `Yaşı ${randomPlayer.age}'dir.`,
      `Toplamda ${randomPlayer.clubs_played.length} farklı kulüpte oynamıştır.`,
    ]);
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

  private _filter(name: string): PlayerData[] {
    const filterValue = name.toLowerCase();

    return this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
  }

  async testGetData(): Promise<unknown> {
    try {
      if (isPlatformServer(this.platformId)) {
        console.log('getting data from cloudflare');
        return this.cloudflareClient.kv.namespaces.values
          .get('b41f8509cf73416e8b71cafff02fd96e', 'players/5111', {
            account_id: '3178c0d2061751d76bd2ec9ebbf13921',
          })
          .then(async (data) => {
            console.log('data.json()', await data.json());
            return data.json();
          })
          .catch((error) => {
            console.log('error', error);
          });
      }
    } catch (error) {
      console.log('error', error);
    }
  }
}
