/// <reference types="react" />
/// <reference types="react-dom" />

// Relaxed JSX intrinsic elements to prevent spurious TS errors from mis-configured project contexts
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
