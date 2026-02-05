import { SearchResult } from '../types';

/**
 * ARCHITECTURE:
 * Layer 1: Data Acquisition (Network I/O)
 * Layer 2: Processing (Parsing & Cleaning)
 * Layer 3: Knowledge Extraction (Entity Recognition)
 * Layer 4: Orchestration (Service Export)
 */

// ==========================================
// LAYER 1: DATA ACQUISITION
// Responsibility: Raw HTTP Requests only.
// ==========================================

const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

// Primitive: Fetch JSON
const fetchRawJson = async (url: string): Promise<any | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// Primitive: Fetch Text/HTML via Proxy Rotation
const fetchRawHtml = async (url: string): Promise<string | null> => {
  // Try proxies sequentially
  for (const proxy of PROXIES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // Increased timeout for better yield
      
      const res = await fetch(`${proxy}${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(id);
      
      if (res.ok) {
        const text = await res.text();
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          return text;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
};

// ==========================================
// LAYER 2: PROCESSING
// Responsibility: Convert Raw Data to Queryable Object (DOM).
// ==========================================

const parseHtmlToDom = (html: string): Document => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

const sanitizeUrl = (rawUrl: string | null): string | null => {
  if (!rawUrl) return null;
  try {
    const decoded = decodeURIComponent(rawUrl);
    if (decoded.includes('duckduckgo.com/l/?uddg=')) {
      return decoded.split('duckduckgo.com/l/?uddg=')[1].split('&')[0];
    }
    return decoded.startsWith('http') ? decoded : null;
  } catch {
    return null;
  }
};

// Helper: Extract YouTube Thumbnail from URL
const getYouTubeThumbnail = (url: string): string | undefined => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : undefined;
};

// ==========================================
// LAYER 3: KNOWLEDGE EXTRACTION
// Responsibility: Extract Entities (Title, Snippet, Link, Type).
// ==========================================

// Extractor A: Structured Data (Wikipedia API)
const extractFromWikipediaApi = async (query: string): Promise<SearchResult[]> => {
  // Increased limit to 20 as requested
  const endpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=20&namespace=0&format=json&origin=*`;
  const data = await fetchRawJson(endpoint);

  if (!data || !Array.isArray(data) || data.length < 4) return [];

  const titles = data[1] as string[];
  const descriptions = data[2] as string[];
  const links = data[3] as string[];

  return titles.map((title, i) => ({
    title,
    link: links[i],
    snippet: descriptions[i] || 'Wikipedia entry.',
    source: 'wikipedia.org',
    type: 'web'
  }));
};

// Extractor B: Unstructured HTML (General Web)
const extractFromHtmlDom = (dom: Document): SearchResult[] => {
  const results: SearchResult[] = [];
  
  // Refined selectors for better accuracy
  const resultNodes = dom.querySelectorAll('.result, .web-result, .result-link, .links_main, .g');

  resultNodes.forEach(node => {
    const anchor = node.querySelector('a');
    if (!anchor) return;

    const rawLink = anchor.getAttribute('href');
    const link = sanitizeUrl(rawLink);
    const title = anchor.textContent?.trim();
    
    let snippet = '';
    const snippetNode = node.querySelector('.snippet, .result__snippet, .st, .result-snippet');
    if (snippetNode && snippetNode.textContent) {
      snippet = snippetNode.textContent.trim();
    }

    if (link && title) {
      // Classification Logic
      let type: 'web' | 'video' = 'web';
      let imageUrl = undefined;

      if (link.includes('youtube.com') || link.includes('youtu.be') || link.includes('vimeo.com')) {
        type = 'video';
        imageUrl = getYouTubeThumbnail(link);
      }

      results.push({
        title,
        link,
        snippet: snippet.slice(0, 250), // Increased snippet length
        source: new URL(link).hostname.replace(/^www\./, ''),
        type,
        imageUrl
      });
    }
  });

  return results;
};

// ==========================================
// LAYER 4: ORCHESTRATION (The Public Service)
// Responsibility: Combine strategies, deduplicate, and return clean data.
// ==========================================

export const searchTheWeb = async (query: string): Promise<SearchResult[]> => {
  try {
    // 1. Parallel Acquisition
    const wikiPromise = extractFromWikipediaApi(query);
    // Requesting more data from the HTML source
    const webHtmlPromise = fetchRawHtml(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kz=1`); // kz=1 disables safe search strictly for getting more raw results if needed, usually ignored by proxy

    const [wikiResults, rawHtml] = await Promise.all([
      wikiPromise.catch(() => []),
      webHtmlPromise.catch(() => null)
    ]);

    // 2. Processing & Extraction
    let webResults: SearchResult[] = [];
    if (rawHtml) {
      const dom = parseHtmlToDom(rawHtml);
      webResults = extractFromHtmlDom(dom);
    }

    // 3. Merging & Deduplication
    // Prioritize Web results for diversity, then Wiki
    const combined = [...webResults, ...wikiResults];
    const seenLinks = new Set<string>();
    const cleanResults: SearchResult[] = [];

    for (const item of combined) {
      // Dedup by normalized link
      const normalizedLink = item.link.replace(/\/$/, ''); 
      if (!seenLinks.has(normalizedLink)) {
        seenLinks.add(normalizedLink);
        cleanResults.push(item);
      }
    }

    // Return strict data structure, limit increased to 20
    return cleanResults.slice(0, 20);
    
  } catch (error) {
    console.error('Search Orchestration Failed:', error);
    return [];
  }
};