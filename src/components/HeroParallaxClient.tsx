"use client";
import { useEffect } from "react";

import { applyParallax } from "../../design-system/motion";

export default function HeroParallaxClient() {
  useEffect(() => {
    applyParallax('#hero-parallax');
  }, []);
  return null;
}
