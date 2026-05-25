/* Core data model. Everything below mirrors the Supabase schema with
 * client-side conventions (camelCase, optional fields explicit). */

export type Currency = 'GBP' | 'INR' | 'EUR' | 'USD';
export type SplitId  = 'everyone' | 'just-me' | 'parents' | 'dad' | string;

export interface Family {
  id: string;
  name: string;
  owner_id?: string;
  created_at?: string;
}

export interface Member {
  id: string;
  family_id?: string;
  name: string;
  initial: string;
  color?: string;
  avatarPath?: string | null;
  position?: number;
}

export interface Card {
  id: string;
  family_id?: string;
  owner: string;     // member id
  nick: string;
  last4: string;
  position?: number;
}

export interface Trip {
  id: string;
  family_id: string;
  name: string;
  short_name?: string;
  start_date: string;  // YYYY-MM-DD
  end_date: string;
  primary_currency: Currency;
  default_split: SplitId;
  status?: 'active' | 'ended';
  created_at?: string;
}

export interface Expense {
  id: string;
  ts?: number;
  date: string;
  preTrip?: boolean;
  payer: string;       // member id
  card?: string | null;
  amount: number;       // minor units
  currency: Currency;
  title?: string | null;
  category?: string | null;
  split?: SplitId;
  hasPhoto?: boolean;
  photo?: string | null;       // local-only data URL when newly attached
  photoPath?: string | null;
  synced?: boolean;
}

export interface EventItem {
  id: string;
  date: string;
  time?: string | null;
  title: string;
  tag?: string | null;
  location?: string | null;
  note?: string | null;
  done: boolean;
  synced?: boolean;
}

export interface VaultItem {
  id: string;
  name: string;
  meta?: string;
  storage_path?: string | null;
}

export interface TripParticipant {
  user_id: string;
  member_id?: string | null;
  role?: 'owner' | 'member';
}

export interface Settlement {
  id: string;
  trip_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency: Currency;
  method?: string | null;
  note?: string | null;
  settled_at?: string;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
  currency: Currency;
}

export interface ServerSnapshot {
  family: Family | null;
  userFamily: Family | null;
  members: Member[];
  cards: Card[];
  trip: Trip | null;
  pastTrips: Trip[];
  expenses: Expense[];
  events: EventItem[];
  vault: VaultItem[];
  participants: TripParticipant[];
  settlements?: Settlement[];
}

export type SyncStatusKind = 'offline' | 'live' | 'stale' | 'unknown';

export type View = 'hub' | 'trip' | 'new-trip';
export type Tab  = 'add' | 'log' | 'summary' | 'next';
export type Overlay = null | 'settings' | 'wrap';
