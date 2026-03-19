-- Update handle_new_user to support Google OAuth metadata
-- Google provides: given_name, family_name, full_name, avatar_url
-- Email/password provides: first_name, last_name, role

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'first_name',
      new.raw_user_meta_data ->> 'given_name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'last_name',
      new.raw_user_meta_data ->> 'family_name',
      ''
    ),
    coalesce(new.raw_user_meta_data ->> 'role', 'landlord')
  );
  return new;
end;
$$;
