// types/model-viewer.d.ts
declare module '@google/model-viewer' {
  export interface ModelViewerElement extends HTMLElement {
    src?: string;
    poster?: string;
    alt?: string;
    loading?: string;
    reveal?: string;
    autoRotate?: boolean;
    cameraControls?: boolean;
    shadowIntensity?: string;
    shadowSoftness?: string;
    exposure?: string;
    toneMapping?: string;
    environmentImage?: string;
    skyboxImage?: string;
    fieldOfView?: string;
    minCameraOrbit?: string;
    maxCameraOrbit?: string;
    cameraOrbit?: string;
    disableZoom?: boolean;
    ar?: boolean;
    arModes?: string;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'model-viewer': ModelViewerElement;
  }
  
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        loading?: string;
        reveal?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'shadow-softness'?: string;
        exposure?: string;
        'tone-mapping'?: string;
        'environment-image'?: string;
        'skybox-image'?: string;
        'field-of-view'?: string;
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'camera-orbit'?: string;
        'disable-zoom'?: boolean;
        ar?: boolean;
        'ar-modes'?: string;
      };
    }
  }
}