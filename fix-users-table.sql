-- 检查列是否存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'is_enabled'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN is_enabled boolean DEFAULT true;
    END IF;

    -- 确保所有现有用户默认启用
    UPDATE public.users
    SET is_enabled = true
    WHERE is_enabled IS NULL;

    -- 特别启用 Lynn 的账号
    UPDATE public.users
    SET is_enabled = true
    WHERE email = 'zengl5335@gmail.com';

    -- 更新 auth.users 的元数据
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object('is_enabled', true)
    WHERE email = 'zengl5335@gmail.com';
END $$; 