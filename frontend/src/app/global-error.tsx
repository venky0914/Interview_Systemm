"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-6"
        >
          <div className="text-6xl">⚠️</div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-dark-400 text-sm">
              An unexpected error occurred. Our team has been notified.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-red-400 text-xs mt-2 font-mono bg-dark-800 px-3 py-2 rounded-lg">
                {error.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={reset}>
              Try again
            </Button>
            <Button onClick={() => (window.location.href = "/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </motion.div>
      </body>
    </html>
  );
}
