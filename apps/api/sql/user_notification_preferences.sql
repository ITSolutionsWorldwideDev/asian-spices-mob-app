-- User notification preference toggles (Phase 1)
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  order_updates BOOLEAN NOT NULL DEFAULT true,
  recipe_reel_updates BOOLEAN NOT NULL DEFAULT true,
  new_products BOOLEAN NOT NULL DEFAULT true,
  price_drops BOOLEAN NOT NULL DEFAULT true,
  restock_alerts BOOLEAN NOT NULL DEFAULT true,
  promotional_emails BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
