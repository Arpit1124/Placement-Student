import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN matching the installed version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  fileName: string;
  fileSize: number;
}

export async function extractTextFromPdfFile(file: File): Promise<ExtractedDocument> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit. Please upload a smaller resume PDF.');
  }

  // Handle plain text files directly
  if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    const text = await file.text();
    return {
      text: text.trim(),
      pageCount: 1,
      fileName: file.name,
      fileSize: file.size,
    };
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Invalid file type. Please upload a valid PDF (.pdf) or text (.txt) file.');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += `--- Page ${pageNum} ---\n${pageString}\n\n`;
    }

    const cleanedText = fullText.trim();
    if (cleanedText.length < 20) {
      throw new Error(
        'Could not extract sufficient text from this PDF. It may contain scanned images without OCR text. Please paste your resume text directly.'
      );
    }

    return {
      text: cleanedText,
      pageCount: numPages,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    if (error.message && error.message.includes('scanned')) {
      throw error;
    }
    throw new Error(
      error.message ||
        'Failed to read PDF file. Please ensure it is not password protected, or paste your resume text directly.'
    );
  }
}
