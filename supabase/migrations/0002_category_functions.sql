-- 0002_category_functions.sql
-- Two admin operations as single transactions: reorder one category, and delete a category
-- (moving its products first). Both run with SECURITY INVOKER: the existing admin RLS policies
-- on categories and products still decide what is allowed, and the explicit is_admin() check
-- gives a clear error to anyone else. Run once after 0001_categories.sql.

begin;

-- Move a category one step up or down, keeping sort_order consecutive (1..n).
create or replace function public.categories_move(p_id uuid, p_direction text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
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

  select array_agg(id order by sort_order, created_at, id)
    into ordered_ids
    from public.categories;

  if ordered_ids is null or not (p_id = any(ordered_ids)) then
    raise exception 'التصنيف غير موجود.' using errcode = 'no_data_found';
  end if;

  idx := array_position(ordered_ids, p_id);
  swap_with := case when p_direction = 'up' then idx - 1 else idx + 1 end;

  -- Already first (moving up) or last (moving down): nothing to change.
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

-- Delete a category. If it has products, p_target must be another category; all products move
-- there first, in the same transaction. The last remaining category cannot be deleted.
-- Returns the number of products that were moved.
create or replace function public.categories_delete(p_id uuid, p_target uuid default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  product_count integer;
  total_count integer;
  remaining_ids uuid[];
  i integer;
begin
  if not (select public.is_admin()) then
    raise exception 'غير مصرح.' using errcode = 'insufficient_privilege';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.categories'));

  if not exists (select 1 from public.categories where id = p_id) then
    raise exception 'التصنيف غير موجود.' using errcode = 'no_data_found';
  end if;

  select count(*) into total_count from public.categories;
  if total_count <= 1 then
    raise exception 'يجب أن يبقى تصنيف واحد على الأقل.' using errcode = 'check_violation';
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
    update public.products set category_id = p_target where category_id = p_id;
  end if;

  delete from public.categories where id = p_id;

  -- Keep sort_order consecutive after the delete.
  select array_agg(id order by sort_order, created_at, id) into remaining_ids from public.categories;
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

commit;
