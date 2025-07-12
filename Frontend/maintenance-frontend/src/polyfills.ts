/**
 * This file contains polyfills needed by Angular and is loaded before the app.
 * Add more polyfills if needed.
 */

// Used for reflect-metadata in JIT. If you use AOT (and only Angular decorators), you can remove.
import 'zone.js';  // Included with Angular CLI.

// WebGPU fallback
(window as any).WebGPU = (window as any).WebGPU || {};
