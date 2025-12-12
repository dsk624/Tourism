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

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  precipitation: number;
  sunrise: string;
  sunset: string;
}

export interface LocationData {
  city: string;
  province: string; // mapped from region_name
  latitude: number;
  longitude: number;
}

// Cloudflare D1 types
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

// Cloudflare Pages Function types
export interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
}

export type PagesFunction<Env = unknown, Params extends string = any, Data = unknown> = (
  context: EventContext<Env, Params, Data>
) => Response | Promise<Response>;