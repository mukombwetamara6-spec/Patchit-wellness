export type Language = 'en' | 'sn' | 'nd';

export type LifeStage = 'cycle' | 'recovery' | 'balance' | 'endo';

export interface PainRecord {
  id: string;
  timestamp: string;
  intensity: number; // 1-10
  symptomText: string;
  symptoms: string[]; // e.g., ["Cramps", "Headache", "Hot Flash", "Back Pain"]
  products: string[]; // e.g., ["Transdermal Patch", "Heating Belt", "Zumbani Tea"]
  channel: 'app' | 'ussd' | 'whatsapp';
  absenteeism?: boolean; // True if young girl missed school/work
  lifeStage: LifeStage;
}

export interface PodcastEpisode {
  id: string;
  title: Record<Language, string>;
  speaker: string;
  duration: string;
  size: string;
  category: string;
  description: Record<Language, string>;
  downloaded: boolean;
}

export interface StoreProduct {
  id: string;
  name: string;
  priceUSD: number;
  image: string;
  description: Record<Language, string>;
}

export interface ImpactStats {
  subscriberCount: number;
  distributedFreeCount: number;
  fundsMobilizedUSD: number;
}

export interface PatchReminder {
  id: string;
  type: 'patch' | 'gel';
  title: Record<Language, string>;
  enabled: boolean;
  intervalHours: number;
  lastChanged: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface UssdState {
  menuPath: string; // e.g., "root", "log_pain", "log_pain_intensity", "order_status", "hot_flash"
  tempPainIntensity?: number;
  tempSymptoms?: string[];
  lastMessage: string;
}
