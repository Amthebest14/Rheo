/// <reference types="vite/client" />

declare module '*.png' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        balance?: 'show' | 'hide';
        size?: 'md' | 'sm';
        label?: string;
      };
    }
  }
}
export {};
