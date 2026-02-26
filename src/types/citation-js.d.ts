// Type declarations for citation-js library
declare module 'citation-js' {
  interface CitationData {
    title: string;
    author?: Array<{ literal: string }>;
    issued?: { 'date-parts': number[][] };
    type?: string;
    'container-title'?: string;
    volume?: string;
    issue?: string;
    page?: string;
    publisher?: string;
    DOI?: string;
    URL?: string;
  }

  class Cite {
    constructor(data: CitationData | CitationData[]);
    format(type: string, options?: { format?: string; template?: string }): string;
  }

  export { Cite };
}