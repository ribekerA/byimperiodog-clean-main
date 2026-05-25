// src/lib/route.ts
import type { Route } from "next";

export const routes = {
  home: '/' as Route,
  sobre: '/sobre' as Route,
  filhotes: '/filhotes' as Route,
  contato: '/contato' as Route,
  politica: '/politica-de-privacidade' as Route,
  blog: '/blog' as Route,
};

export type AppRoutes = Route;