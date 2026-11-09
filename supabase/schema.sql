-- Run once in the Supabase SQL editor. No service-role key is needed by the app.
create table if not exists public.admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
create policy "Admins read own membership" on public.admins for select to authenticated using (user_id = (select auth.uid()));
-- Membership may only be granted using the SQL editor / trusted backend.
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
create or replace function public.is_admin() returns boolean
 language sql stable security definer set search_path = ''
 as $$ select exists(select 1 from public.admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 150),
 brand text not null check(char_length(brand) between 1 and 80),
 category text not null check(category in ('العناية بالبشرة','العناية بالشعر','واقيات الشمس','مستحضرات التجميل')),
 description text not null check(char_length(description) between 5 and 3000),
 price integer not null check(price between 1 and 10000000),
 image_url text not null default '' check(char_length(image_url)<=1000 and (image_url='' or image_url ~ '^https://' or image_url ~ '^/products/[a-zA-Z0-9_.-]+\.svg$')),
 available boolean not null default true,
 featured boolean not null default false,
 is_demo boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
create policy "Public catalog" on public.products for select to anon, authenticated using (true);
create policy "Admins insert" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete" on public.products for delete to authenticated using ((select public.is_admin()));
create index if not exists products_category_idx on public.products(category);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and (select public.is_admin()));
create policy "Admins read image metadata" on storage.objects for select to authenticated using (bucket_id='product-images' and (select public.is_admin()));
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id='product-images' and (select public.is_admin())) with check (bucket_id='product-images' and (select public.is_admin()));
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and (select public.is_admin()));
