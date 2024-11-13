/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_ENV: string;
    // Aggiungi qui altre variabili d'ambiente se necessarie
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  // Dichiarazioni per moduli statici
  declare module '*.svg' {
    import * as React from 'react';
    export const ReactComponent: React.FunctionComponent<
      React.SVGProps<SVGSVGElement> & { title?: string }
    >;
    const src: string;
    export default src;
  }
  
  declare module '*.jpg' {
    const content: string;
    export default content;
  }
  
  declare module '*.png' {
    const content: string;
    export default content;
  }
  
  declare module '*.json' {
    const content: string;
    export default content;
  }