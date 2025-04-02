-- 启用指定邮箱的账号
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_enabled}',
  'true'
)
WHERE email = 'zengl5335@gmail.com';

UPDATE public.users
SET is_enabled = true
WHERE email = 'zengl5335@gmail.com'; 