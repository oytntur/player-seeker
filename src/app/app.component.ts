import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import playerData from '../../public/assets/players.json';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { AsyncPipe, JsonPipe } from '@angular/common';

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
  options: PlayerData[] = JSON.parse(JSON.stringify(playerData));
  filteredOptions$: Observable<PlayerData[]>;

  randomPlayer = signal<PlayerData | undefined>(undefined);

  playerScore = signal(0);

  constructor() {
    this.filteredOptions$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filter(name as string) : this.options.slice();
      })
    );
    this.getRandomPlayer();
  }

  getRandomPlayer() {
    const randomIndex = Math.floor(Math.random() * this.options.length);
    this.randomPlayer.set(this.options[randomIndex]);
    this.playerScore.update((score) => score + 100);
  }

  displayFn(user: PlayerData): string {
    return user && user.name ? user.name : '';
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
}
