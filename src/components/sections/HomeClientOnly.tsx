"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

type DeferredModule<Props extends object> = {
  default: ComponentType<Props>;
};

const loadTestimonials = () => import("@/components/Testimonials");
const loadAiMatchmakerChat = () => import("@/components/sections/AiMatchmakerChat");
const loadTextTestimonials = () => import("@/components/sections/TextTestimonials");

function DeferredSlot<Props extends object>({
  loader,
  componentProps,
  minHeight,
}: {
  loader: () => Promise<DeferredModule<Props>>;
  componentProps: Props;
  minHeight: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [Component, setComponent] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let active = true;
    const load = () => {
      void loader().then((module) => {
        if (active) setComponent(() => module.default);
      });
    };

    if (!("IntersectionObserver" in window)) {
      const fallbackTimer = setTimeout(load, 0);
      return () => {
        active = false;
        clearTimeout(fallbackTimer);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        load();
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(node);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [loader]);

  return (
    <div ref={ref} style={Component ? undefined : { minHeight }}>
      {Component ? <Component {...componentProps} /> : null}
    </div>
  );
}

export function ClientOnlyTestimonials({ title }: { title?: string }) {
  return (
    <DeferredSlot
      loader={loadTestimonials}
      componentProps={{ title }}
      minHeight={360}
    />
  );
}

export function ClientOnlyAiMatchmakerChat() {
  return (
    <DeferredSlot
      loader={loadAiMatchmakerChat}
      componentProps={{}}
      minHeight={640}
    />
  );
}

export function ClientOnlyTextTestimonials() {
  return (
    <DeferredSlot
      loader={loadTextTestimonials}
      componentProps={{}}
      minHeight={900}
    />
  );
}
