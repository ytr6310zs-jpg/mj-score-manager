INSERT INTO public.tournaments (name)
VALUES ('大会1')
ON CONFLICT (name) DO NOTHING;