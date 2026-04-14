"use client";
import { useEffect, useRef } from "react";
export default function PrintTrigger() {
  const triggered = useRef(false);
  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    setTimeout(() => window.print(), 300);
  }, []);
  return null;
}
