SELECT email, role, is_enabled FROM users WHERE email = 'zengl5335@gmail.com';

-- 创建检查用户是否为管理员的函数
CREATE OR REPLACE FUNCTION check_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = user_id;
    
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建更新用户角色的函数
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
    -- 检查调用者是否为管理员
    IF NOT check_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only administrators can update user roles';
    END IF;

    -- 更新用户角色
    UPDATE users
    SET role = new_role
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
