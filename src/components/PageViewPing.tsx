"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { trackPageView, isAdminRoute } from "@/lib/tracking";

export default function PageViewPing(props: Record<string, any>) {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track pageviews from admin routes
    if (isAdminRoute(pathname)) {
      return;
    }
    
    trackPageView({ ...props, pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return null;
}
