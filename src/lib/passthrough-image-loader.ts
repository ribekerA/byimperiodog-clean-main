import type { ImageLoader } from "next/image";

// Custom loader que apenas retorna a URL passada, evitando o wrapper /_next/image
// Útil quando já aplicamos transformações na origem (ex.: Supabase Image Transformations).
export const passthroughImageLoader: ImageLoader = ({ src }) => {
  return src;
};

export default passthroughImageLoader;
