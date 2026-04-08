import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import readXlsxFile from 'read-excel-file';

// --- Safe Module Resolution ---
// Helpers to handle imports in browser environments (ESM/CommonJS interop)
// This prevents the "Cannot set properties of undefined" error.
const getModule = (mod: any) => mod?.default || mod;

// Define Worker URL to match the library version exactly
const PDF_WORKER_URL = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Safe PDF Worker Initialization
const initPdfWorker = () => {
  try {
    const lib = getModule(pdfjsLib);
    // Check if lib exists and GlobalWorkerOptions is available before setting
    if (lib && lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    }
  } catch (e) {
    console.warn('PDF.js worker init warning (safe to ignore if not using PDFs):', e);
  }
};

// Initialize immediately but safely
initPdfWorker();

export const processFile = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name;

  // Requested Format: ------- Full Filename -------
  const header = `------- ${fileName} -------`;
  let content = "";

  console.log(`[FileProcessor] Processing: ${fileName} (${fileType})`);

  try {
    // A. Images (OCR)
    if (fileType.startsWith('image/')) {
      content = await processImage(file);
    }
    
    // B. PDF
    else if (fileType === 'application/pdf') {
      content = await processPdf(file);
    }

    // C. Word (.docx)
    else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileName.endsWith('.docx')
    ) {
      content = await processWord(file);
    }

    // D. Excel (.xlsx)
    else if (
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        fileName.endsWith('.xlsx')
    ) {
      content = await processExcel(file);
    }

    // E. Plain Text / Code / JSON / Markdown
    else if (
        fileType.startsWith('text/') || 
        fileName.endsWith('.txt') || 
        fileName.endsWith('.md') || 
        fileName.endsWith('.json') ||
        fileName.endsWith('.js') ||
        fileName.endsWith('.ts') ||
        fileName.endsWith('.tsx') ||
        fileName.endsWith('.jsx') ||
        fileName.endsWith('.py') ||
        fileName.endsWith('.csv')
    ) {
      content = await file.text();
    } 
    else {
      content = "[System: File type not supported for text extraction, but file is attached.]";
    }

    // Return structured content
    return `${header}\n${content.trim()}\n---------------------------`;

  } catch (error) {
    console.error(`[FileProcessor] Error processing ${fileName}:`, error);
    return `${header}\n[Error extracting text: ${(error as Error).message}]\n---------------------------`;
  }
};

// --- Parsers ---

const processImage = async (file: File): Promise<string> => {
  const tesseract = getModule(Tesseract);
  const result = await tesseract.recognize(file, 'eng');
  return result.data.text || "[No text found in image]";
};

const processPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const lib = getModule(pdfjsLib);
  
  // Double check worker before loading
  if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
      lib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  }

  const loadingTask = lib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText.push(`[Page ${i}]: ${pageText}`);
  }
  
  return fullText.join('\n\n');
};

const processWord = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const mammothLib = getModule(mammoth);
  const result = await mammothLib.extractRawText({ arrayBuffer });
  return result.value || "[Empty Word Document]";
};

const processExcel = async (file: File): Promise<string> => {
  const reader = getModule(readXlsxFile);
  const rows = await reader(file);
  
  if (!rows || rows.length === 0) return "[Empty Excel Sheet]";

  // Simple CSV-like formatting
  return rows.map((row: any[]) => {
    return row.map((cell: any) => {
      if (cell === null || cell === undefined) return '';
      return String(cell).replace(/\n/g, ' ');
    }).join(' | ');
  }).join('\n');
};