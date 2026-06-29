-- ============================================================
-- InterviewForge AI — Supabase PostgreSQL Setup
-- Run this in the Supabase SQL editor after creating your project
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Indexes for performance ──────────────────────────────────────────────

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Subjects
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects(slug);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);

-- User subjects (enrollment)
CREATE INDEX IF NOT EXISTS idx_user_subjects_user ON user_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subjects_subject ON user_subjects(subject_id);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_top ON questions(is_top_question) WHERE is_top_question = true;

-- Notes
CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);

-- Quiz attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_subject ON quiz_attempts(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(completed_at DESC);

-- Interview sessions
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_sessions(user_id);

-- Progress
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_subject ON progress(user_id, subject_id);

-- Bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_resource ON bookmarks(resource_type, resource_id);

-- ─── Full-text search on questions ────────────────────────────────────────

ALTER TABLE questions ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(question_text, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_questions_fts ON questions USING gin(search_vector);

-- ─── Row Level Security (RLS) ──────────────────────────────────────────────
-- Only needed if using Supabase's built-in auth.
-- Since we use our own JWT, these policies are optional but add an extra security layer.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- ─── Useful views ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW subject_stats AS
SELECT
  s.id,
  s.name,
  s.slug,
  COUNT(DISTINCT q.id) AS total_questions,
  COUNT(DISTINCT n.id) AS total_notes,
  COUNT(DISTINCT cp.id) AS total_coding_problems,
  COUNT(DISTINCT us.user_id) AS enrolled_users
FROM subjects s
LEFT JOIN questions q ON q.subject_id = s.id
LEFT JOIN notes n ON n.subject_id = s.id
LEFT JOIN coding_problems cp ON cp.subject_id = s.id
LEFT JOIN user_subjects us ON us.subject_id = s.id
GROUP BY s.id, s.name, s.slug;

CREATE OR REPLACE VIEW leaderboard_all_time AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.avatar_url,
  ROUND(AVG(qa.score_pct)::numeric, 1) AS avg_score,
  COUNT(qa.id) AS total_quizzes,
  ROW_NUMBER() OVER (ORDER BY AVG(qa.score_pct) DESC) AS rank
FROM users u
JOIN quiz_attempts qa ON qa.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.full_name, u.avatar_url
HAVING COUNT(qa.id) >= 3
ORDER BY avg_score DESC;
