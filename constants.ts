import { Model, ApiConfig } from './types';

export const API_CONFIG: ApiConfig = {
  endpoint: 'https://ollama.com/api/chat',
  apiKey: process.env.OLLAMA_CLOUD_API_KEY as string,
};

export const AVAILABLE_MODELS: Model[] = [
  { id: 'deepseek-v3.1:671b-cloud', name: 'deepseek-v3.1:671b-cloud' },
  { id: 'gpt-oss:20b-cloud', name: 'gpt-oss:20b-cloud' },
  { id: 'gpt-oss:120b-cloud', name: 'gpt-oss:120b-cloud' },
  { id: 'kimi-k2:1t-cloud', name: 'kimi-k2:1t-cloud' },
  { id: 'qwen3-coder:480b-cloud', name: 'qwen3-coder:480b-cloud' },
  { id: 'glm-4.6:cloud', name: 'glm-4.6:cloud' },
  { id: 'minimax-m2:cloud', name: 'minimax-m2:cloud' },
  { id: 'mistral-large-3:675b-cloud', name: 'mistral-large-3:675b-cloud' },
  { id: 'glm-4.7:cloud', name: 'glm-4.7:cloud' },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

