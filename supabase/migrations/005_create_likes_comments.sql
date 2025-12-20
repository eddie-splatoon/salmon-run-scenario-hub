-- likes と comments テーブルの作成

-- いいねテーブル
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  scenario_code VARCHAR(50) NOT NULL REFERENCES scenarios(code) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scenario_code, user_id)
);

-- コメントテーブル
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  scenario_code VARCHAR(50) NOT NULL REFERENCES scenarios(code) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_likes_scenario_code ON likes(scenario_code);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_scenario_code ON comments(scenario_code);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- updated_atを自動更新するトリガー
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

