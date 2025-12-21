-- Eddie Splatoonを管理者として登録
-- 注意: このマイグレーションを実行する前に、Eddie SplatoonのユーザーIDを確認してください
-- Supabase Dashboardで以下のSQLを実行してください:
--
-- INSERT INTO admins (user_id)
-- SELECT id FROM auth.users
-- WHERE email = 'eddie.splatoon@example.com'  -- 実際のEmailアドレスに置き換えてください
-- ON CONFLICT (user_id) DO NOTHING;
--
-- または、ユーザーIDが分かっている場合は:
--
-- INSERT INTO admins (user_id)
-- VALUES ('USER_ID_HERE')  -- 実際のユーザーIDに置き換えてください
-- ON CONFLICT (user_id) DO NOTHING;

-- このファイルは参考用です。実際の登録はSupabase Dashboardで手動で行ってください。

