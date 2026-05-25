"use client";

import { useEffect } from "react";

export function AdminBodyClass() {
  useEffect(() => {
    document.body.classList.add("admin-shell");
    return () => {
      document.body.classList.remove("admin-shell");
    };
  }, []);

  return null;
}

export default AdminBodyClass;
