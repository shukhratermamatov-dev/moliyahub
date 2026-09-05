// У pdfmake нет собственных типов для серверного класса PdfPrinter (только
// для браузерного pdfMake.createPdf()), поэтому здесь — минимальное
// объявление ровно того, что использует lib/finance/pdf.ts. Так сборка не
// зависит от наличия/формы стороннего @types/pdfmake.
declare module "pdfmake" {
  export type PdfFontDescriptor = {
    normal: string;
    bold: string;
    italics: string;
    bolditalics: string;
  };

  export default class PdfPrinter {
    constructor(fonts: Record<string, PdfFontDescriptor>);
    createPdfKitDocument(docDefinition: Record<string, unknown>): NodeJS.ReadableStream & { end: () => void };
  }
}
