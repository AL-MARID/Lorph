import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import ytSearch from 'yt-search';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  type: 'web' | 'video';
  imageUrl?: string;
}

const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors-anywhere.herokuapp.com/'
];

function getHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export class DeepResearchEngine {
  private ollamaEndpoint: string;
  private apiKey: string;
  private model: string;

  constructor(model: string, apiKey: string) {
    let endpoint = process.env.OLLAMA_ENDPOINT || "https://ollama.com/api/chat";
    // If the user accidentally put the API key in the endpoint field, it will have an underscore and no slashes
    if (endpoint.includes('_') && !endpoint.includes('/')) {
      endpoint = "https://ollama.com/api/chat";
    }
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = 'http://' + endpoint;
    }
    
    // Validate URL to prevent Invalid URL crash
    try {
      new URL(endpoint);
    } catch (e) {
      endpoint = "https://ollama.com/api/chat";
    }

    this.ollamaEndpoint = endpoint;
    let key = apiKey || (process.env.OLLAMA_CLOUD_API_KEY || process.env.OLLAMA_API_KEY || "").trim();
    key = key.replace(/^(bearer\s*)+/ig, '').trim();
    this.apiKey = key;
    this.model = model;
  }

  private async callOllama(prompt: string, jsonFormat = false): Promise<string> {
    let response;
    try {
      response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          format: jsonFormat ? 'json' : undefined,
          response_format: jsonFormat ? { type: 'json_object' } : undefined,
          temperature: 0.3,
          options: { temperature: 0.3 }
        })
      });
    } catch (error: any) {
      if (error.message && error.message.includes('Invalid URL')) {
        throw new Error(`Invalid Ollama Endpoint URL: ${this.ollamaEndpoint}`);
      }
      throw error;
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (response.status === 401) {
        throw new Error(`Invalid API Key. The key you provided (${this.apiKey.substring(0, 4)}...) is either invalid, expired, or disabled by the provider. Please check your API key. (Status 401)`);
      }
      throw new Error(`Ollama error: ${response.statusText} ${text ? `- ${text}` : ''}`);
    }
    const data = await response.json() as any;
    return data.message?.content || data.choices?.[0]?.message?.content || '';
  }

  private async fetchHtml(url: string): Promise<string | null> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };

    // Try direct fetch first (Node.js doesn't need CORS proxies)
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const text = await res.text();
        if (text.includes('<html') || text.includes('<!DOCTYPE')) return text;
      }
    } catch (e) {
      // Direct fetch failed, try fallbacks
    }

    // Fallback to proxies if direct fetch fails
    for (const proxy of PROXIES) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${proxy}${encodeURIComponent(url)}`, { headers, signal: controller.signal });
        clearTimeout(id);
        if (res.ok) {
          const text = await res.text();
          if (text.includes('<html') || text.includes('<!DOCTYPE')) return text;
        }
      } catch { continue; }
    }
    return null;
  }

  private async executeSearch(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // DuckDuckGo Lite Search
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('https://lite.duckduckgo.com/lite/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: `q=${encodeURIComponent(query)}`,
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        $('tr').each((i, el) => {
          const titleEl = $(el).find('a.result-link');
          if (titleEl.length > 0) {
            const title = titleEl.text().trim();
            const link = titleEl.attr('href');
            const snippet = $(el).next('tr').find('.result-snippet').text().trim();
            if (link && link.startsWith('http')) {
              results.push({
                title,
                link,
                snippet,
                source: getHostname(link),
                type: link.includes('youtube.com') ? 'video' : 'web'
              });
            }
          }
        });
      }
    } catch (e) {
      console.error("DuckDuckGo search failed:", e);
    }
    
    try {
      // YouTube Search
      const ytResults = await ytSearch(query);
      const videos = ytResults.videos.slice(0, 3);
      for (const v of videos) {
        if (v.url && v.title) {
          results.push({
            title: v.title,
            link: v.url,
            snippet: v.description || '',
            source: 'youtube.com',
            type: 'video',
            imageUrl: v.thumbnail
          });
        }
      }
    } catch (e) {
      console.error("YouTube search failed, falling back to DDG:", e);
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('https://lite.duckduckgo.com/lite/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: `q=${encodeURIComponent(query + ' site:youtube.com')}`,
          signal: controller.signal
        });
        clearTimeout(id);
        if (res.ok) {
          const html = await res.text();
          const $ = cheerio.load(html);
          $('tr').each((i, el) => {
            const titleEl = $(el).find('a.result-link');
            if (titleEl.length > 0) {
              const title = titleEl.text().trim();
              const link = titleEl.attr('href');
              const snippet = $(el).next('tr').find('.result-snippet').text().trim();
              if (link && link.includes('youtube.com/watch')) {
                results.push({
                  title,
                  link,
                  snippet,
                  source: 'youtube.com',
                  type: 'video'
                });
              }
            }
          });
        }
      } catch (fallbackError) {
        console.error("DDG YouTube fallback failed:", fallbackError);
      }
    }

    return results;
  }

  private async scrapePage(url: string): Promise<{ text: string, links: string[], images: string[], videos: string[] } | null> {
    const html = await this.fetchHtml(url);
    if (!html) return null;
    const $ = cheerio.load(html);
    
    // Extract images and videos before removing noise
    const images: string[] = [];
    
    // 1. Prioritize OpenGraph images (usually the main article image)
    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (ogImage && ogImage.startsWith('http')) {
      images.push(ogImage);
    }

    // 2. Fallback to large images in the body
    $('img[src^="http"]').each((_, el) => {
      const src = $(el).attr('src');
      const width = parseInt($(el).attr('width') || '0', 10);
      // Avoid tiny icons, logos, tracking pixels
      if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('pixel') && !src.includes('avatar')) {
        if (width > 150 || !$(el).attr('width')) {
           images.push(src);
        }
      }
    });

    const videos: string[] = [];
    const ogVideo = $('meta[property="og:video"]').attr('content');
    if (ogVideo && ogVideo.startsWith('http')) {
      videos.push(ogVideo);
    }
    
    $('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) videos.push(src);
    });
    
    // Remove noise
    $('script, style, nav, footer, header, aside, .ad, .banner, iframe, svg').remove();
    
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Limit text per page
    const links: string[] = [];
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) links.push(href);
    });

    return { 
      text, 
      links: Array.from(new Set(links)).slice(0, 10), 
      images: Array.from(new Set(images)).slice(0, 3),
      videos: Array.from(new Set(videos)).slice(0, 2)
    };
  }

  private extractJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (e2) {
          return null;
        }
      }
      // Try finding first { and last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
          try {
              return JSON.parse(text.substring(start, end + 1));
          } catch(e3) {
              return null;
          }
      }
      return null;
    }
  }

  public async *runDeepResearch(query: string) {
    const emitStep = (step: any) => JSON.stringify({ type: 'research_step', data: step }) + '\n';
    const emitStepUpdate = (id: string, updates: any) => JSON.stringify({ type: 'research_step_update', data: { id, ...updates } }) + '\n';

    let allScrapedData: any[] = [];
    let uniqueLinks = new Set<string>();
    let stepIdCounter = 0;

    // Initial Thinking
    const initialThinkId = `step_${stepIdCounter++}`;
    yield emitStep({ id: initialThinkId, type: 'thinking', title: 'Thinking', status: 'active' });

    const intentPrompt = `You are an expert researcher. The user asked: "${query}".
First, strip away any conversational filler (e.g., "hello", "how are you", "can you tell me"). Identify the core, essential intent of what the user actually wants to know.
Think step-by-step about how to research this core intent deeply.
Then, provide 15-20 highly specific, targeted search queries in English.
CRITICAL RULE: The search queries MUST BE STRICTLY IN ENGLISH, regardless of the user's original language. If the user asks in Arabic, translate the concepts to English for the search queries.
Output ONLY valid JSON in this exact format:
{
  "thought": "your detailed thinking process analyzing the core intent",
  "actionTitle": "Searching [core topic]",
  "queries": ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14", "q15"]
}`;

    const intentJson = await this.callOllama(intentPrompt, true);
    let intent = this.extractJson(intentJson);
    
    if (!intent || !intent.queries || intent.queries.length === 0) {
        intent = { 
            thought: "Analyzing query to extract core search terms...", 
            actionTitle: "Searching web", 
            queries: [query] 
        };
    }

    yield emitStepUpdate(initialThinkId, { content: intent.thought, status: 'done' });

    const DEPTH = 3; // Number of research iterations
    for (let depth = 0; depth < DEPTH; depth++) {
      // Search Step
      const searchStepId = `step_${stepIdCounter++}`;
      let currentQueries = intent.queries;
      let currentActionTitle = intent.actionTitle;

      if (depth > 0) {
        const thinkId = `step_${stepIdCounter++}`;
        yield emitStep({ id: thinkId, type: 'thinking', title: 'Thinking', status: 'active' });
        
        const contextSummary = allScrapedData.map(d => d.text.substring(0, 300)).join('\n');
        const nextPrompt = `You are researching: "${query}".
Current findings summary: ${contextSummary.substring(0, 3000)}
Think about what is still missing or needs deeper investigation.
Provide 15-20 highly specific, targeted search queries in English to explore the missing areas.
Output ONLY valid JSON in this exact format:
{
  "thought": "your detailed thinking process",
  "actionTitle": "Searching [new topic]",
  "queries": ["new q1", "new q2", "new q3", "new q4", "new q5", "new q6", "new q7", "new q8", "new q9", "new q10", "new q11", "new q12", "new q13", "new q14", "new q15"]
}`;
        
        const nextJson = await this.callOllama(nextPrompt, true);
        const nextPlan = this.extractJson(nextJson);
        
        if (nextPlan && nextPlan.queries && nextPlan.queries.length > 0) {
            currentQueries = nextPlan.queries;
            currentActionTitle = nextPlan.actionTitle || "Searching deeper";
            yield emitStepUpdate(thinkId, { content: nextPlan.thought || "Analyzing findings to generate new queries...", status: 'done' });
        } else {
            yield emitStepUpdate(thinkId, { content: "Analyzing findings to generate new queries...", status: 'done' });
        }
      }

      yield emitStep({ id: searchStepId, type: 'searching', title: currentActionTitle, queries: currentQueries, status: 'active', results: [] });

      const searchResults = await Promise.all(currentQueries.map((q: string) => this.executeSearch(q)));
      const flatResults = searchResults.flat();
      
      const newSources: any[] = [];
      for (const r of flatResults) {
          const normalized = r.link.replace(/\/$/, '');
          if (!uniqueLinks.has(normalized)) {
              uniqueLinks.add(normalized);
              const sourceObj = { title: r.title, url: r.link, domain: r.source, snippet: r.snippet };
              newSources.push(sourceObj);
              allScrapedData.push({ ...sourceObj, text: r.snippet, images: [], videos: [], isRead: false }); // Add as basic source even if not deeply scraped
          }
      }

      yield emitStepUpdate(searchStepId, { results: newSources, status: 'done' });

      // Read Step
      if (newSources.length > 0) {
          const readStepId = `step_${stepIdCounter++}`;
          // Limit deep reading to top 15 per iteration to manage time, but we keep all in allScrapedData
          const sourcesToRead = newSources.slice(0, 15);
          yield emitStep({ id: readStepId, type: 'reading', title: `Reading ${sourcesToRead.length} pages`, status: 'active', results: [] });
          
          const readResults = [];
          for (const source of sourcesToRead) {
              // Skip youtube links for scraping text, we already have their metadata
              if (source.url.includes('youtube.com')) {
                  const existing = allScrapedData.find(d => d.url === source.url);
                  if (existing) {
                      existing.videos = [source.url];
                      existing.isRead = true;
                  }
                  readResults.push(source);
                  yield emitStepUpdate(readStepId, { results: [...readResults] });
                  continue;
              }

              const data = await this.scrapePage(source.url);
              if (data) {
                  const existing = allScrapedData.find(d => d.url === source.url);
                  if (existing) {
                      existing.text = data.text;
                      existing.images = data.images;
                      existing.videos = data.videos;
                      existing.links = data.links;
                      existing.isRead = true;
                  }
                  readResults.push(source);
                  yield emitStepUpdate(readStepId, { results: [...readResults] });
              }
          }
          yield emitStepUpdate(readStepId, { status: 'done' });
      }
    }

    // Final Synthesis Thinking
    const finalThinkId = `step_${stepIdCounter++}`;
    yield emitStep({ id: finalThinkId, type: 'thinking', title: 'Thinking', status: 'active' });
    yield emitStepUpdate(finalThinkId, { content: "Synthesizing gathered information to form a comprehensive answer.", status: 'done' });

    // Done Step
    const doneStepId = `step_${stepIdCounter++}`;
    yield emitStep({ id: doneStepId, type: 'done', title: 'Done', status: 'active' });
    yield emitStepUpdate(doneStepId, { content: `Successfully analyzed ${allScrapedData.length} sources across ${DEPTH} research iterations.`, status: 'done' });

    // Emit final sources for the Sources tab
    const finalSourcesList = allScrapedData.map(d => {
        let imageUrl = d.images[0] || undefined;
        let type = d.videos.length > 0 ? 'video' : d.images.length > 0 ? 'image' : 'web';
        
        // Extract YouTube thumbnail if it's a youtube link
        if (d.url.includes('youtube.com') || d.url.includes('youtu.be')) {
            type = 'video';
            const videoIdMatch = d.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (videoIdMatch && videoIdMatch[1]) {
                imageUrl = `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
            }
        }

        return {
            title: d.title || d.url,
            link: d.url,
            snippet: d.snippet || d.text.substring(0, 150) + '...',
            source: getHostname(d.url),
            imageUrl: imageUrl,
            type: type
        };
    });
    yield JSON.stringify({ type: 'sources', data: finalSourcesList }) + '\n';

    // 4. Data Synthesis & Final Response Generation
    const readData = allScrapedData.filter(d => d.isRead || d.videos?.length > 0).slice(0, 20);
    const context = readData.map((d, idx) => `[Source ${idx + 1}: ${d.url}]\nTitle: ${d.title}\nText: ${d.text.substring(0, 1500)}\nImages: ${d.images?.join(', ') || 'None'}\nVideos: ${d.videos?.join(', ') || 'None'}`).join('\n\n');
    
    const finalPrompt = `
You are an advanced Deep Research AI.
Based on the following scraped data from ${readData.length} deeply read sources, provide a highly detailed, comprehensive, and expert-level response to the user's query.

CRITICAL INSTRUCTIONS:
1. DO NOT include a 'Reasoning/Chain-of-Thought' section. Do NOT mention your internal process, do NOT say "I searched", "The user asked", or "I analyzed". Just provide the direct, well-formatted, and professional answer immediately.
2. CITATIONS ARE STRICTLY MANDATORY: You MUST use Inline Citations pointing to the exact sources used for each claim. Use the exact text fragment format: \`[Source Name](URL#:~:text=exact_words_from_text)\`. 
   Example: "Quantum computing is extremely fast [IBM](https://ibm.com#:~:text=extremely_fast)."
3. RICH MEDIA IS MANDATORY: You MUST dynamically embed rich media directly within your response to make it visually appealing and highly informative. Use markdown images \`![alt](image_url)\` and videos \`[Watch Video](video_url)\` if relevant images/videos were found in the sources.
4. STRUCTURE: Use clear headings (H2, H3), bullet points, and bold text to organize the information logically. The response must be thorough and not just a brief summary.
5. Reply in the same language as the user's original query (e.g., if Arabic, reply in Arabic, but keep URLs/English terms intact). Do NOT say "The user asked for...".
6. At the very end of your response, you MUST provide 3 highly relevant follow-up questions the user can ask to explore the topic further. Format them exactly like this:
<<Question 1>>
<<Question 2>>
<<Question 3>>

User Query: "${query}"

Scraped Data Context:
${context}
`;

    let responseStream;
    try {
      responseStream = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: finalPrompt }],
          stream: true,
          temperature: 0.5,
          options: { temperature: 0.5 }
        })
      });
    } catch (error: any) {
      if (error.message && error.message.includes('Invalid URL')) {
        throw new Error(`Invalid Ollama Endpoint URL: ${this.ollamaEndpoint}`);
      }
      throw error;
    }

    if (!responseStream.ok || !responseStream.body) {
      if (responseStream.status === 401) {
        throw new Error(`Invalid API Key. The key you provided (${this.apiKey.substring(0, 4)}...) is either invalid, expired, or disabled by the provider. Please check your API key. (Status 401)`);
      }
      throw new Error('Failed to stream final response');
    }

    // Pipe the Ollama stream directly to the client
    const reader = responseStream.body as any;
    for await (const chunk of reader) {
      yield chunk.toString();
    }
  }
}
