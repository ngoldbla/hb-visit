"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Delete, Check } from "lucide-react";

interface KioskKeyboardProps {
  onChar: (char: string) => void;
  onDelete: () => void;
  onDone: () => void;
  disabled?: boolean;
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export function KioskKeyboard({
  onChar,
  onDelete,
  onDone,
  disabled = false,
}: KioskKeyboardProps) {
  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return;
      onChar(key);
    },
    [disabled, onChar]
  );

  return (
    <div className="w-full max-w-[640px] mx-auto space-y-2">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5">
          {row.map((key) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleKey(key)}
              disabled={disabled}
              className="w-[60px] h-[60px] bg-gray-100 rounded-xl text-xl font-semibold text-[#000824] flex items-center justify-center transition-colors active:bg-[#ffc421]/30 select-none disabled:opacity-40"
            >
              {key}
            </motion.button>
          ))}
        </div>
      ))}

      {/* Bottom row: Delete, Space, Done */}
      <div className="flex justify-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onDelete}
          disabled={disabled}
          className="w-[90px] h-[60px] bg-gray-200 rounded-xl flex items-center justify-center text-[#333] transition-colors active:bg-gray-300 select-none disabled:opacity-40"
        >
          <Delete className="w-6 h-6" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleKey(" ")}
          disabled={disabled}
          className="flex-1 max-w-[300px] h-[60px] bg-gray-100 rounded-xl text-base font-medium text-[#333]/60 flex items-center justify-center transition-colors active:bg-gray-200 select-none disabled:opacity-40"
        >
          space
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onDone}
          disabled={disabled}
          className="w-[90px] h-[60px] bg-[#ffc421] rounded-xl flex items-center justify-center text-[#000824] font-semibold transition-colors active:bg-[#ff9d00] select-none disabled:opacity-40"
        >
          <Check className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}
