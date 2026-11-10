-- 0001_categories.sql
-- Categories become a managed table. Database only; the app is not changed by this file.
-- Owner-approved. Does not change products RLS policies, admins, order_events, or search_events.
-- Run once, in the Supabase SQL editor of the target project. The whole file is one transaction.
--
-- Accent palette (change it here, in one place; the check constraint below must match):
--   #0f2b45 navy   #28578e blue   #c9a35a gold   #b86c7b rose   #28715a green   #8b6127 bronze

begin;

-- 1. Table ----------------------------------------------------------------------
create table if not exists public.categories (
 id uuid primary key default gen_random_uuid(),
 name_ar text not null check (char_length(name_ar) between 1 and 40),
 slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
 description_ar text check (description_ar is null or char_length(description_ar) <= 120),
 image_path text,
 accent text not null default '#0f2b45'
  check (accent in ('#0f2b45','#28578e','#c9a35a','#b86c7b','#28715a','#8b6127')),
 sort_order integer not null default 0,
 is_visible boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- 2. Row level security (same role pattern as public.products) ------------------
alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

drop policy if exists "Public sees visible categories" on public.categories;
create policy "Public sees visible categories" on public.categories
  for select to anon, authenticated using (is_visible = true);

drop policy if exists "Admins see all categories" on public.categories;
create policy "Admins see all categories" on public.categories
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins insert categories" on public.categories;
create policy "Admins insert categories" on public.categories
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admins update categories" on public.categories;
create policy "Admins update categories" on public.categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins delete categories" on public.categories;
create policy "Admins delete categories" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- 3. Maximum of 8 categories ----------------------------------------------------
-- Security invoker: an admin's select policy already sees every row, so the count is complete.
-- The advisory lock makes two simultaneous inserts unable to both pass at 7 rows.
create or replace function public.categories_enforce_max()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('public.categories'));
  if (select count(*) from public.categories) >= 8 then
    raise exception 'لا يمكن إضافة أكثر من 8 تصنيفات.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_max_8 on public.categories;
create trigger categories_max_8
  before insert on public.categories
  for each row execute function public.categories_enforce_max();

-- 4. The slug never changes after creation -------------------------------------
create or replace function public.categories_lock_slug()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'لا يمكن تغيير رابط التصنيف (slug) بعد إنشائه.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_slug_immutable on public.categories;
create trigger categories_slug_immutable
  before update on public.categories
  for each row execute function public.categories_lock_slug();

-- 5. updated_at is maintained by the database ----------------------------------
create or replace function public.categories_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.categories_touch_updated_at();

-- 6. Link products to categories -----------------------------------------------
-- restrict: a category cannot be deleted while any product still points to it.
alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete restrict;
create index if not exists products_category_id_idx on public.products(category_id);

-- products.category (text) stays in place. It is made nullable and loses its name-list check
-- so that categories created later by the owner can be stored. It is not dropped here.
alter table public.products alter column category drop not null;
alter table public.products drop constraint if exists products_category_check;

-- 7. Seed the four current categories -------------------------------------------
-- Names: src/lib/catalog.ts and supabase/schema.sql (products.category check).
-- Notes: src/components/storefront/navigation.tsx (categoryNotes).
-- Images: src/components/storefront/navigation.tsx (categoryArt) -> public/images/categories/.
-- Slugs and accents are NOT in the repo; they are proposed here and need the owner's approval.
insert into public.categories (name_ar, slug, description_ar, image_path, accent, sort_order) values
 ('العناية بالبشرة', 'skin-care', 'كل ما يحتاجه روتينكِ', '/images/categories/skincare-care.webp', '#0f2b45', 1),
 ('العناية بالشعر', 'hair-care', 'من الجذور إلى الأطراف', '/images/categories/hair-and-body.webp', '#28578e', 2),
 ('واقيات الشمس', 'sun-care', 'رفيقتكِ في كل يوم', '/images/categories/sun-care.webp', '#c9a35a', 3),
 ('مستحضرات التجميل', 'cosmetics', 'تفاصيل تعبّر عنكِ', '/images/categories/beauty-polish.webp', '#b86c7b', 4)
on conflict (slug) do nothing;

-- 8. Backfill products.category_id from the text value ---------------------------
update public.products p
   set category_id = c.id
  from public.categories c
 where p.category_id is null
   and p.category = c.name_ar;

-- 9. Verification: stop and roll back if any product has no category_id ---------
do $$
declare
  missing_count integer;
  missing_list text;
begin
  select count(*),
         string_agg(p.id::text || ' | ' || p.name || ' | ' || coalesce(p.category, '(null)'), E'\n' order by p.name)
    into missing_count, missing_list
    from public.products p
   where p.category_id is null;

  if missing_count > 0 then
    raise exception using
      message = format('الترحيل توقف: %s منتج بلا category_id. الترحيل لم يُطبَّق.%s%s',
                       missing_count, E'\n', missing_list),
      errcode = 'check_violation';
  end if;
  raise notice 'verified: % categories seeded, 0 products without category_id',
    (select count(*) from public.categories);
end;
$$;

commit;
