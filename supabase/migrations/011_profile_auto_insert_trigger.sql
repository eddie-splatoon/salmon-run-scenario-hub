-- auth.users への INSERT 時に public.profiles を自動作成するトリガー
-- Issue #1 の AC「ログイン成功時に profiles テーブルへレコードを自動挿入するSQLトリガーの設定」に対応
--
-- プライバシー保護方針に従い、Googleの user_metadata（full_name, picture）は使用しない。
-- display_name / avatar_url はユーザーが /profile で設定するまで NULL のままとする。

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 既存ユーザーの backfill（トリガー追加以前にサインアップしたユーザー向け）
INSERT INTO public.profiles (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
