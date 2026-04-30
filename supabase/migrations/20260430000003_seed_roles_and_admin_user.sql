INSERT INTO public.roles (code, name)
VALUES
  ('admin', '管理'),
  ('editor', '編集'),
  ('viewer', '参照')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO public.users (user_id, password_hash, display_name, role_id, is_active)
SELECT
  'admin',
  '$2b$10$b9Mt1/y0QLhMXRDDv30oAOJTzlrlZxPa9pKV4iODu3so8nPF0wrmS',
  '初期管理者',
  r.id,
  TRUE
FROM public.roles AS r
WHERE r.code = 'admin'
ON CONFLICT (user_id) DO NOTHING;
