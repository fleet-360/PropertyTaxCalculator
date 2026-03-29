declare module 'bidi-js' {
  export interface BidiEmbeddingLevels {
    levels: Uint8Array;
    paragraphs: { start: number; end: number; level: number }[];
  }

  export interface BidiApi {
    getEmbeddingLevels(text: string, baseDirection: 'ltr' | 'rtl'): BidiEmbeddingLevels;
    getReorderedString(
      text: string,
      embedLevelsResult: BidiEmbeddingLevels,
      start?: number,
      end?: number
    ): string;
  }

  function bidiFactory(): BidiApi;
  export default bidiFactory;
}
