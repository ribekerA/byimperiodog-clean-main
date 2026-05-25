"use client";

/**
 * StarRating — display estático ou interativo.
 *
 * Props:
 *   value     — nota atual (0-5, aceita decimais no modo display)
 *   max       — total de estrelas (padrão 5)
 *   size      — "sm" | "md" | "lg"
 *   interactive — habilita hover + click para seleção
 *   onChange  — callback quando usuário seleciona nota
 */

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  value:        number;
  max?:         number;
  size?:        "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?:    (value: number) => void;
  className?:   string;
}

const SIZE = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className = "",
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayed = hovered ?? value;

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Selecione uma nota" : `${value} de ${max} estrelas`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue  = i + 1;
        const filled     = displayed >= starValue;
        const halfFilled = !filled && displayed >= starValue - 0.5;

        return (
          <motion.button
            key={i}
            type={interactive ? "button" : undefined}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? value === starValue : undefined}
            aria-label={interactive ? `${starValue} estrela${starValue > 1 ? "s" : ""}` : undefined}
            className={`relative shrink-0 ${interactive ? "cursor-pointer" : "cursor-default"}`}
            onClick={interactive && onChange ? () => onChange(starValue) : undefined}
            onMouseEnter={interactive ? () => setHovered(starValue) : undefined}
            onMouseLeave={interactive ? () => setHovered(null) : undefined}
            whileTap={interactive ? { scale: 0.85 } : undefined}
            transition={{ duration: 0.12 }}
            tabIndex={interactive ? 0 : -1}
            onKeyDown={interactive && onChange ? (e) => {
              if (e.key === "Enter" || e.key === " ") onChange(starValue);
            } : undefined}
          >
            <svg
              viewBox="0 0 20 20"
              className={SIZE[size]}
              aria-hidden="true"
              fill="none"
            >
              {/* Background star (empty) */}
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                fill={filled || halfFilled ? "#f59e0b" : "#d1d5db"}
                style={halfFilled ? { clipPath: "inset(0 50% 0 0)" } : undefined}
              />
              {halfFilled && (
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  fill="#d1d5db"
                  style={{ clipPath: "inset(0 0 0 50%)" }}
                />
              )}
            </svg>
          </motion.button>
        );
      })}
    </div>
  );
}
