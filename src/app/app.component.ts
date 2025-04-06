import {
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  filter,
  firstValueFrom,
  map,
  Observable,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { CloudflareApiHelper } from './helpers/services/cloudflare-api-helper.service';
import { PlayerData, PlayerOption } from './helpers/types/player.types';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

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
  options: PlayerOption[] = [];
  filteredOptions$: Observable<PlayerOption[]> = new Observable();

  randomPlayerIndex = signal<number | undefined>(undefined);
  randomPlayerIndex$ = toObservable(this.randomPlayerIndex);
  randomPlayer = signal<PlayerData | undefined>(undefined);
  randomPlayerHints = signal<string[]>([]);

  currentHints = signal<string[]>([]);

  playerScore = signal(0);
  cloudflareApiHelper = inject(CloudflareApiHelper);

  platformId = inject(PLATFORM_ID);
  destroyRef = inject(DestroyRef);

  constructor() {
    this.filteredOptions$ = this.myControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((value) => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filter(name as string) : this.options.slice();
      })
    );

    firstValueFrom(this.cloudflareApiHelper.getPlayerOptions())
      .then((response) => {
        const payload = response;

        const data = payload.result.players;

        this.options = data.map((player: { id: number; name: string }) => ({
          player_id: player.id,
          name: player.name,
        }));
      })
      .then(() => {
        this.getRandomPlayer();

        this.randomPlayerIndex$
          .pipe(
            filter((randomIndex) => randomIndex !== undefined),
            takeUntilDestroyed(this.destroyRef),
            switchMap((randomIndex) => {
              return this.cloudflareApiHelper.getPlayerData(
                this.options[randomIndex].player_id
              );
            }),
            tap((playerDataPayload) => {
              const playerData: PlayerData = {
                player_id: playerDataPayload.result.player.id,
                ...playerDataPayload.result.player,
              };

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
      });
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

  showAnswer() {
    const randomPlayer = this.randomPlayer();
    alert(`Cevap: ${randomPlayer?.name} - ${randomPlayer?.current_club}`);
    this.getRandomPlayer();
    this.currentHints.set([]);
    this.myControl.reset();
    this.playerScore.update((score) => score - 120);
  }

  private _filter(name: string): PlayerOption[] {
    const normalizedSearch = this.normalizeString(name);

    return this.options.filter((option) => {
      // Eğer option string ise
      if (typeof option === 'string') {
        return this.normalizeString(option).includes(normalizedSearch);
      }
      // Eğer option bir nesne ise ve name özelliği varsa
      else if (option.name) {
        return this.normalizeString(option.name).includes(normalizedSearch);
      }
      return false;
    });
  }
  private normalizeString(input: string): string {
    return input
      .normalize('NFD') // Unicode normalization form
      .replace(/[\u0300-\u036f]/g, '') // Diyakritik işaretleri kaldır
      .toLowerCase();
  }
}
