"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Delete } from "lucide-react";

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
  submitLabel?: string;
  showSubmit?: boolean;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "delete"],
];

export function NumericKeypad({
  onDigit,
  onDelete,
  onSubmit,
  disabled = false,
  submitLabel = "Enter",
  showSubmit = false,
}: NumericKeypadProps) {
  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return;
      if (key === "delete") {
        onDelete();
      } else if (key === "submit") {
        onSubmit?.();
      } else if (key !== "") {
        onDigit(key);
      }
    },
    [disabled, onDigit, onDelete, onSubmit]
  );

  // Replace the empty bottom-left key with submit if showSubmit is true
  const keys = showSubmit
    ? KEYS.map((row, i) =>
        i === 3 ? ["submit", "0", "delete"] : row
      )
    : KEYS;

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] mx-auto">
      {keys.flat().map((key, i) => {
        if (key === "") {
          return <div key={i} />;
        }

        const isDelete = key === "delete";
        const isSubmit = key === "submit";

        return (
          <motion.button
            key={i}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleKey(key)}
            disabled={disabled}
            className={`
              h-[80px] rounded-2xl text-2xl font-semibold
              flex items-center justify-center
              transition-colors select-none
              ${disabled ? "opacity-40 cursor-not-allowed" : "active:bg-[#ffc421]/30"}
              ${isSubmit
                ? "bg-[#ffc421] text-[#000824] text-lg"
                : isDelete
                  ? "bg-gray-100 text-[#333]"
                  : "bg-gray-100 text-[#000824]"
              }
            `}
          >
            {isDelete ? (
              <Delete className="w-7 h-7" />
            ) : isSubmit ? (
              submitLabel
            ) : (
              key
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
