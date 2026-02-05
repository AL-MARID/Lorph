import { Message } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const streamChatResponse = async (
  messages: Message[],
  modelId: string,
  endpoint: string,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  signal?: AbortSignal // Added signal parameter
) => {
  try {
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const body = JSON.stringify({
      model: modelId,
      messages: apiMessages,
      stream: true,
      options: {
        temperature: 0.7,
        top_k: 40,
        top_p: 0.9
      }
    });

    let response: Response | undefined;
    let lastError: Error | undefined;
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
      if (signal?.aborted) {
          throw new Error('Aborted by user');
      }

      try {
        // Reset response for this attempt
        response = undefined;

        // Attempt: Direct connection first
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body,
            signal // Pass signal to fetch
          });
        } catch (networkError: any) {
          if (networkError.name === 'AbortError') throw networkError;
          
          // Fallback: CORS Proxy
          if (i === 0) console.warn('Direct connection failed, switching to proxy tunnel...');
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(endpoint)}`;
          response = await fetch(proxyUrl, {
            method: 'POST',
            headers,
            body,
            signal // Pass signal to fetch
          });
        }

        if (response && response.ok) {
          break; // Success, exit retry loop
        }

        // Handle specific HTTP errors that are worth retrying
        if (response && [503, 502, 504, 429].includes(response.status)) {
          const text = await response.text().catch(() => '');
          const errorMsg = `Server busy (Status ${response.status}). Retrying...`;
          console.warn(errorMsg);
          lastError = new Error(errorMsg);
          
          if (i < MAX_RETRIES - 1) {
            await delay(1500 * (i + 1)); 
            continue;
          }
        } else if (response) {
            const errorText = await response.text().catch(() => response.statusText);
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

      } catch (e: any) {
        if (e.name === 'AbortError') throw e;
        lastError = e;
        if (i < MAX_RETRIES - 1) {
             console.warn(`Attempt ${i + 1} failed: ${e.message}. Retrying...`);
             await delay(1500 * (i + 1));
             continue;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error('Unable to connect to the server after multiple attempts.');
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      if (signal?.aborted) {
        reader.cancel();
        throw new Error('Aborted by user');
      }

      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value, { stream: true });
      
      buffer += chunkValue;
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; 

      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const json = JSON.parse(line);
          
          if (json.message && json.message.content) {
            onChunk(json.message.content);
          } else if (json.choices && json.choices[0]?.delta?.content) {
            onChunk(json.choices[0].delta.content);
          } else if (json.response) {
            onChunk(json.response);
          }
          
          if (json.done || json.finish_reason) {
            done = true;
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }

    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer);
        if (json.message?.content) onChunk(json.message.content);
        else if (json.choices?.[0]?.message?.content) onChunk(json.choices[0].message.content);
      } catch (e) {}
    }

    onComplete();
  } catch (error: any) {
    if (error.message === 'Aborted by user' || error.name === 'AbortError') {
        onComplete(); // Treat abort as completion
        return;
    }
    console.error('API Error:', error);
    let errorMessage = error.message;
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Connection failed. Please check your internet connection.';
    } else if (errorMessage.includes('503')) {
        errorMessage = 'The AI service is currently busy. Please try again in a moment.';
    }
    onError(new Error(errorMessage));
  }
};