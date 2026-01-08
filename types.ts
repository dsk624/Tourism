

export interface Schedule {
  id: number;
  title: string;
  description: string;
  schedule_date: string;
}

export interface Attraction {
  id: string;
  name: string;
  province: string;
  description: string;
  imageUrl: string;
  tags: string[];
  rating: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface User {
  id: number;
  username: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Add missing LocationData interface for weather services
export interface LocationData {
  city: string;
  province: string;
  latitude: number;
  longitude: number;
}

// Add missing WeatherData interface for weather services
export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  precipitation: number;
  sunrise: string;
  sunset: string;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  pressure: number;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

export interface D1PreparedStatement {
  bind(...args: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

export interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  meta?: any;
  error?: string;
}

export interface Env {
  DB: D1Database;
}