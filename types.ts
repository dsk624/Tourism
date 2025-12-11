export interface Attraction {
  id: string;
  name: string;
  province: string;
  description: string;
  imageUrl: string;
  tags: string[];
  rating: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  city?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
