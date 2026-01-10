"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, X } from "lucide-react";

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function ErrorScreen({ message, onRetry, onCancel }: ErrorScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-8">
      {/* Error icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="w-32 h-32 rounded-full bg-red-500 flex items-center justify-center shadow-xl">
          <AlertCircle className="w-20 h-20 text-white" />
        </div>
      </motion.div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-md"
      >
        <h1 className="text-4xl font-bold text-[#000824] mb-4">
          Check-In Failed
        </h1>
        <p className="text-xl text-[#000824]/70">{message}</p>
      </motion.div>

      {/* Help text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/60 backdrop-blur rounded-2xl p-6 max-w-md text-center"
      >
        <p className="text-lg text-[#000824]/80">
          If you&apos;re having trouble, please ask reception for assistance or contact
          your host directly.
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4"
      >
        <Button
          onClick={onRetry}
          className="h-16 px-8 text-xl bg-[#2153ff] hover:bg-[#1a42cc] rounded-xl"
        >
          <RotateCcw className="w-6 h-6 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="h-16 px-8 text-xl rounded-xl border-2"
        >
          <X className="w-6 h-6 mr-2" />
          Cancel
        </Button>
      </motion.div>

      {/* Auto-reset indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8"
      >
        <p className="text-lg text-[#000824]/40">
          This screen will reset automatically
        </p>
      </motion.div>
    </div>
  );
}
