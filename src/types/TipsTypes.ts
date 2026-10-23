export interface FilteredPrediction {
  type: string;
  prediction: string;
  percentage: number;
  cardType?: string | string[];
  result?: 'WON' | 'LOST' | 'PENDING';
}
export interface MatchInfo {
  stadium?: {
    name: string;
    city: string;
  };
  time: string;
}
export interface TeamFlags {
  [teamName: string]: string;
}
export interface LiveScore {
  homeScore: number;
  awayScore: number;
  status: 'FT' | 'HT' | 'LIVE' | 'not_started';
  minute: number;
  ftScore?: {
    homeScore: number;
    awayScore: number;
  };
  htftResult?: string;
}
export interface Predictions {
  winner?: FilteredPrediction;
  totalgoals?: FilteredPrediction;
  btts?: FilteredPrediction;
  htft?: FilteredPrediction;
  correctscore?: FilteredPrediction;
  corners?: FilteredPrediction;
}
export interface TipMatch {
  matchId: number | string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
  prediction?: string;
  matchDate?: string;
  matchTime: string;
  competitionName: string;
  leagueFlag: string;
  status?: string;
  matchStatus?: 'not_started' | 'FT' | 'HT' | 'LIVE';
  finalScore?: number[];
  halfTimeScore?: number[];
  predictions: Predictions;
  matchInfo?: MatchInfo;
  teamFlags: TeamFlags;
  filteredPrediction?: FilteredPrediction;
  cardType?: string | string[];
  liveScore: LiveScore;
}
export interface TipsApiResponse {
  success: boolean;
  message: string;
  data: {
    data: TipMatch[];
    total: number;
    cardType: string;
    date: string;
    premium: boolean;
    timestamp: string;
  };
}
export interface TipsScreenProps {
  navigation: any;
  route: {
    params: {
      cardType: string;
      date: string;
    };
  };
}
