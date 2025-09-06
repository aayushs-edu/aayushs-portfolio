declare module 'three' {
  export * from 'three/src/Three';
}

// If you plan to use FBXLoader, add this as well:
declare module 'three/examples/jsm/loaders/FBXLoader' {
  import { Loader, Group, LoadingManager } from 'three';
  
  export class FBXLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (object: Group) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(data: ArrayBuffer | string, path: string): Group;
  }
}