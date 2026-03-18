export interface BlockData {
  id: string;
  type: BlockType;
  data: Record<string, any>;
  order: number;
}

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'html'
  | 'quote'
  | 'list'
  | 'divider'
  | 'button'
  | 'spacer';

export interface HeadingData {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  alignment: 'left' | 'center' | 'right';
  color: string;
}

export interface ParagraphData {
  html: string; // Rich text HTML content
  alignment: 'left' | 'center' | 'right';
  fontSize: number; // in px, default 16
}

export interface ImageData {
  url: string;
  alt: string;
  title: string;
  caption: string;
  width: string; // e.g. '100%', '50%', '300px'
  alignment: 'left' | 'center' | 'right';
  link: string;
  loading: 'lazy' | 'eager';
}

export interface VideoData {
  url: string;
  caption: string;
  iframeTitle: string;
}

export interface HtmlData {
  code: string;
}

export interface QuoteData {
  text: string;
  author: string;
  style: 'simple' | 'bordered';
}

export interface ListData {
  type: 'ordered' | 'unordered';
  items: string[];
}

export interface DividerData {
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  width: string; // e.g. '100%', '50%'
}

export interface ButtonData {
  text: string;
  url: string;
  style: 'filled' | 'outline';
  color: string;
  size: 'small' | 'medium' | 'large';
  target: '_self' | '_blank';
  rel: string; // nofollow, sponsored, etc.
  tag: 'a' | 'button';
}

export interface SpacerData {
  height: number; // in px
}

/** Default data factories for each block type */
export const getDefaultBlockData = (type: BlockType): Record<string, any> => {
  switch (type) {
    case 'heading':
      return {
        text: 'New Heading',
        level: 'h2',
        alignment: 'left',
        color: '#000000',
      } as HeadingData;
    case 'paragraph':
      return {
        html: '<p>Start writing...</p>',
        alignment: 'left',
        fontSize: 16,
      } as ParagraphData;
    case 'image':
      return {
        url: '',
        alt: '',
        title: '',
        caption: '',
        width: '100%',
        alignment: 'center',
        link: '',
        loading: 'lazy',
      } as ImageData;
    case 'video':
      return {
        url: '',
        caption: '',
        iframeTitle: 'Embedded video',
      } as VideoData;
    case 'html':
      return {
        code: '',
      } as HtmlData;
    case 'quote':
      return {
        text: 'Enter your quote here...',
        author: '',
        style: 'bordered',
      } as QuoteData;
    case 'list':
      return {
        type: 'unordered',
        items: ['Item 1'],
      } as ListData;
    case 'divider':
      return {
        style: 'solid',
        color: '#cccccc',
        width: '100%',
      } as DividerData;
    case 'button':
      return {
        text: 'Click Me',
        url: '#',
        style: 'filled',
        color: '#1976d2',
        size: 'medium',
        target: '_self',
        rel: '',
        tag: 'a',
      } as ButtonData;
    case 'spacer':
      return {
        height: 40,
      } as SpacerData;
    default:
      return {};
  }
};
