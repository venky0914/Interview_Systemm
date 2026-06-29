"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

interface ProgressDashboard {
  current_streak: number;
  longest_streak: number;
  total_quiz_count: number;
  avg_score_pct: number;
  coding_accuracy: number;
  completion_by_subject: { subject: string; pct: number }[];
  recent_quizzes: { id: string; score: number; mode: string; difficulty: string; date: string }[];
  weak_topics: string[];
  strong_topics: string[];
  activity_heatmap: { date: string; count: number }[];
}

export function useProgress() {
  const [data, setData] = useState<ProgressDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/progress/dashboard");
      setData(res.data);
    } catch {
      setError("Failed to load progress data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
