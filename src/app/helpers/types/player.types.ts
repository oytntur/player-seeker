export type Transfer = {
  from: string;
  to: string;
  date: string;
  fee: string;
};

export type TransferHistory = {
  [season: string]: Transfer[];
};

export type CareerTimeline = {
  season: string;
  club: string;
};

export type PlayerData = {
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

export type PlayerOption = Pick<PlayerData, 'name' | 'player_id'>;
