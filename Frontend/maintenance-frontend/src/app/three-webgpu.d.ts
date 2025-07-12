// This is a placeholder type definition for the 'three/webgpu' module
// that's referenced in @types/three but not actually used in our code
declare module 'three/webgpu' {
  import { Object3D, Scene, Camera } from 'three';
  
  export class WebGPURenderer {
    constructor(parameters?: any);
    render(scene: Scene, camera: Camera): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }

  export class Renderer {
    constructor(parameters?: any);
    render(scene: Scene, camera: Camera): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }
}
