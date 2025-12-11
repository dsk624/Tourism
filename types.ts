export interface Attraction {
  id: string;
  name: string;
  province: string;
  description: string;
  imageUrl: string;
  tags: string[];
  rating: number;
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

// Cloudflare D1 and Pages Functions types
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
  changes?: number;
  lastRowId?: number;
}

export interface PagesFunctionContext {
  env: Env;
  request: Request;
  params: Record<string, string>;
  waitUntil(promise: Promise<any>): void;
  next(): Promise<Response>;
}

export type PagesFunction<T = Env> = (context: PagesFunctionContext & { env: T }) => Promise<Response> | Response;

export interface Env {
  DB: D1Database;
}
