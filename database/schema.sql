-- ARGUS Database Schema

CREATE TABLE IF NOT EXISTS public.conversations (
    session_id TEXT PRIMARY KEY,
    messages JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for sorting / recency queries
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations (updated_at DESC);

-- Optional: index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_conversations_messages ON public.conversations USING GIN (messages);