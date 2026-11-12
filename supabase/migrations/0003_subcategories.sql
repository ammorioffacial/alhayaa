-- 0003_subcategories.sql
-- Two levels of categories: main sections, and subcategories inside a main section.
-- Run once, in the Supabase SQL editor of the target project, after 0002_category_functions.sql.
-- The whole file is one transaction.
--
-- Rules after this file:
--   - A main section has parent_id null. A subcategory has parent_id = a main section. No deeper levels.
--   - At most 8 main sections, and at most 15 subcategories per main section.
--   - A category's parent is set when it is created and cannot change afterwards.
--   - Products belong to a leaf category: a main section that has subcategories cannot hold products.
--   - Move and delete work among siblings (same parent). A main section with subcategories cannot be deleted.

begin;

-- 1. Parent column ---------------------------------------------------------------
alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete restrict;
create index if not exists categories_parent_id_idx on public.categories(parent_id);

-- 2. Hierarchy rules --------------------------------------------------------------
create or replace function public.categories_check_hierarchy()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.parent_id is distinct from old.parent_id then
    raise exception 'لا يمكن تغيير القسم الأب بعد الإنشاء.' using errcode = 'check_violation';
  end if;
  if new.parent_id is not null then
    if new.parent_id = new.id then
      raise exception 'القسم لا يمكن أن يكون أباً لنفسه.' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.categories where id = new.parent_id and parent_id is null) then
      raise exception 'القسم الأب يجب أن يكون قسماً رئيسياً.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists categories_hierarchy on public.categories;
create trigger categories_hierarchy
  before insert or update on public.categories
  for each row execute function public.categories_check_hierarchy();

-- 3. Limits: 8 main sections, 15 subcategories per main section ----------------------
-- Replaces the 8-total limit from 0001. The advisory lock is the same one 0002 uses.
drop trigger if exists categories_max_8 on public.categories;
drop function if exists public.categories_enforce_max();

create or replace function public.categories_enforce_limits()
returns trigger language plpgsql set search_path = '' as $$
declare
  n integer;
begin
  perform pg_advisory_xact_lock(hashtext('public.categories'));
  if new.parent_id is null then
    select count(*) into n from public.categories where parent_id is null;
    if n >= 8 then
      raise exception 'لا يمكن إضافة أكثر من 8 أقسام رئيسية.' using errcode = 'check_violation';
    end if;
  else
    select count(*) into n from public.categories where parent_id = new.parent_id;
    if n >= 15 then
      raise exception 'لا يمكن إضافة أكثر من 15 قسماً فرعياً داخل القسم الواحد.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists categories_limits on public.categories;
create trigger categories_limits
  before insert on public.categories
  for each row execute function public.categories_enforce_limits();

-- 4. Products belong to leaf categories ---------------------------------------------
create or replace function public.products_category_is_leaf()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.category_id is not null
     and exists (select 1 from public.categories where parent_id = new.category_id) then
    raise exception 'لا يمكن وضع المنتج في قسم رئيسي له أقسام فرعية. اختر قسماً فرعياً.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists products_category_leaf on public.products;
create trigger products_category_leaf
  before insert or update of category_id on public.products
  for each row execute function public.products_category_is_leaf();

-- 5. Seed: two new main sections, then their subcategories -----------------------------
-- The skin-care section already exists (0001). It becomes a main section with subcategories.
insert into public.categories (name_ar, slug, accent, sort_order)
values ('العناية بالفم', 'oral-care', '#28715a',
        (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id is null))
on conflict (slug) do nothing;

insert into public.categories (name_ar, slug, accent, sort_order)
values ('العناية بالجسم', 'body-care', '#8b6127',
        (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id is null))
on conflict (slug) do nothing;

insert into public.categories (name_ar, slug, accent, sort_order, parent_id)
select v.name_ar, v.slug, p.accent, v.sort_order, p.id
  from (values
    ('مرطب الوجه',           'skin-moisturizer',  'skin-care', 1),
    ('الغسول',               'skin-cleanser',     'skin-care', 2),
    ('واقي الشمس',           'skin-sunscreen',    'skin-care', 3),
    ('السيرم',               'skin-serum',        'skin-care', 4),
    ('أدوات العناية بالبشرة', 'skin-tools',        'skin-care', 5),
    ('الغرغرة',              'oral-gargle',       'oral-care', 1),
    ('معاجين الأسنان',       'oral-toothpaste',   'oral-care', 2),
    ('فرش الأسنان',          'oral-toothbrush',   'oral-care', 3),
    ('خيط الأسنان',          'oral-floss',        'oral-care', 4),
    ('معطرات الفم',          'oral-mouthwash',    'oral-care', 5),
    ('أجهزة',                'oral-devices',      'oral-care', 6),
    ('غسولات الجسم',         'body-wash',         'body-care', 1),
    ('المرطبات',             'body-moisturizer',  'body-care', 2),
    ('المقشرات',             'body-scrub',        'body-care', 3)
  ) as v(name_ar, slug, parent_slug, sort_order)
  join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;

-- Products that sat in skin-care move to its first subcategory, so the section can hold subcategories.
-- The owner can move them in the admin afterwards.
update public.products
   set category_id = (select id from public.categories where slug = 'skin-cleanser')
 where category_id = (select id from public.categories where slug = 'skin-care');

-- 6. Move and delete work among siblings ----------------------------------------------
create or replace function public.categories_move(p_id uuid, p_direction text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent uuid;
  ordered_ids uuid[];
  idx integer;
  swap_with integer;
  tmp uuid;
  i integer;
begin
  if not (select public.is_admin()) then
    raise exception 'غير مصرح.' using errcode = 'insufficient_privilege';
  end if;
  if p_direction not in ('up', 'down') then
    raise exception 'اتجاه الترتيب غير صحيح.' using errcode = 'invalid_parameter_value';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.categories'));

  select c.parent_id into parent from public.categories c where c.id = p_id;
  if not found then
    raise exception 'التصنيف غير موجود.' using errcode = 'no_data_found';
  end if;

  select array_agg(c.id order by c.sort_order, c.created_at, c.id)
    into ordered_ids
    from public.categories c
   where c.parent_id is not distinct from parent;

  idx := array_position(ordered_ids, p_id);
  swap_with := case when p_direction = 'up' then idx - 1 else idx + 1 end;

  if swap_with < 1 or swap_with > array_length(ordered_ids, 1) then
    return;
  end if;

  tmp := ordered_ids[idx];
  ordered_ids[idx] := ordered_ids[swap_with];
  ordered_ids[swap_with] := tmp;

  for i in 1..array_length(ordered_ids, 1) loop
    update public.categories set sort_order = i where id = ordered_ids[i];
  end loop;
end;
$$;

create or replace function public.categories_delete(p_id uuid, p_target uuid default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  product_count integer;
  total_count integer;
  child_count integer;
  parent uuid;
  remaining_ids uuid[];
  i integer;
begin
  if not (select public.is_admin()) then
    raise exception 'غير مصرح.' using errcode = 'insufficient_privilege';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.categories'));

  select c.parent_id into parent from public.categories c where c.id = p_id;
  if not found then
    raise exception 'التصنيف غير موجود.' using errcode = 'no_data_found';
  end if;

  select count(*) into total_count from public.categories;
  if total_count <= 1 then
    raise exception 'يجب أن يبقى تصنيف واحد على الأقل.' using errcode = 'check_violation';
  end if;

  select count(*) into child_count from public.categories where parent_id = p_id;
  if child_count > 0 then
    raise exception using
      message = format('هذا القسم فيه %s أقسام فرعية. احذفها أولاً.', child_count),
      errcode = 'check_violation';
  end if;

  select count(*) into product_count from public.products where category_id = p_id;

  if product_count > 0 then
    if p_target is null then
      raise exception using
        message = format('هذا التصنيف فيه %s منتجات. اختر تصنيفاً لنقلها إليه قبل الحذف.', product_count),
        errcode = 'check_violation';
    end if;
    if p_target = p_id then
      raise exception 'لا يمكن نقل المنتجات إلى التصنيف نفسه.' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.categories where id = p_target) then
      raise exception 'التصنيف الهدف غير موجود.' using errcode = 'no_data_found';
    end if;
    if exists (select 1 from public.categories where parent_id = p_target) then
      raise exception 'لا يمكن نقل المنتجات إلى قسم رئيسي له أقسام فرعية. اختر قسماً فرعياً.' using errcode = 'check_violation';
    end if;
    update public.products set category_id = p_target where category_id = p_id;
  end if;

  delete from public.categories where id = p_id;

  -- Keep sort_order consecutive among the siblings that remain.
  select array_agg(c.id order by c.sort_order, c.created_at, c.id)
    into remaining_ids
    from public.categories c
   where c.parent_id is not distinct from parent;
  if remaining_ids is not null then
    for i in 1..array_length(remaining_ids, 1) loop
      update public.categories set sort_order = i where id = remaining_ids[i];
    end loop;
  end if;

  return product_count;
end;
$$;

revoke all on function public.categories_move(uuid, text) from public;
revoke all on function public.categories_delete(uuid, uuid) from public;
grant execute on function public.categories_move(uuid, text) to authenticated;
grant execute on function public.categories_delete(uuid, uuid) to authenticated;

-- 7. Verification: stop and roll back if a product sits in a section that has subcategories ----
do $$
declare
  bad_count integer;
  bad_list text;
begin
  select count(*),
         string_agg(p.id::text || ' | ' || p.name, E'\n' order by p.name)
    into bad_count, bad_list
    from public.products p
   where exists (select 1 from public.categories c where c.parent_id = p.category_id);

  if bad_count > 0 then
    raise exception using
      message = format('الترحيل توقف: %s منتج في قسم رئيسي له أقسام فرعية. الترحيل لم يُطبَّق.%s%s',
                       bad_count, E'\n', bad_list),
      errcode = 'check_violation';
  end if;
  raise notice 'verified: % main sections, % subcategories',
    (select count(*) from public.categories where parent_id is null),
    (select count(*) from public.categories where parent_id is not null);
end;
$$;

commit;
