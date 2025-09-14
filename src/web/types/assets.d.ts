/// <reference types="vite/client" />

// Scoped declarations to avoid duplicating vite/client's generic ones
declare module '../../../assets/sprites/*.png' {
  const url: string;
  export default url;
}
declare module '../../../assets/sprites/*.gif' {
  const url: string;
  export default url;
}
declare module '../../../assets/sprites/*.jpg' {
  const url: string;
  export default url;
}
declare module '../../../assets/sprites/*.jpeg' {
  const url: string;
  export default url;
}
declare module '../../../assets/sprites/*.webp' {
  const url: string;
  export default url;
}
// Optional: if you import SVGs directly (we currently use CSS bg), include this
declare module '../../../assets/**/*.svg' {
  const url: string;
  export default url;
}