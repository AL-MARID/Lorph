export interface ProgressEvent {
  step: string;
  message: string;
  status: 'pending' | 'active' | 'done';
}

export type ResearchStepType = 'thinking' | 'searching' | 'reading' | 'done';

export interface ResearchStep {
  id: string;
  type: ResearchStepType;
  title: string;
  content?: string;
  queries?: string[];
  results?: { title: string; url: string; domain: string }[];
  status: 'pending' | 'active' | 'done' | 'error';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  searchResults?: SearchResult[]; // Results found for this message
  relatedQuestions?: string[];    // Questions suggested by AI
  isSearching?: boolean;          // UI State: Is this message currently searching?
  researchSteps?: ResearchStep[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Model {
  id: string;
  name: string;
}

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  imageUrl?: string; // Optional image
  type: 'web' | 'image' | 'video';
}