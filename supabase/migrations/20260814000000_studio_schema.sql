-- STUDIO schema for Supabase PostgreSQL.
-- This migration creates schema only. Application seed data is inserted by
-- the Spring Boot seeders on first startup, not by this SQL file.
-- Never place Supabase API keys or database passwords in a migration.

begin;

create extension if not exists pgcrypto;

create table if not exists public.brand_settings (
    id text primary key default gen_random_uuid()::text,
    name varchar(255) not null,
    logo_url varchar(255),
    primary_color varchar(255),
    secondary_color varchar(255),
    font_family varchar(255),
    tone_guidelines varchar(2000)
);

create table if not exists public.app_user (
    id text primary key default gen_random_uuid()::text,
    email varchar(255) not null,
    password_hash varchar(255) not null,
    name varchar(255),
    role varchar(255) not null default 'USER',
    brand_id text,
    created_at timestamptz not null default now(),
    constraint app_user_role_check check (role in ('USER', 'ADMIN')),
    constraint app_user_email_key unique (email),
    constraint app_user_brand_id_fkey
        foreign key (brand_id) references public.brand_settings(id)
);

create table if not exists public.product (
    id text primary key default gen_random_uuid()::text,
    brand_id text not null,
    created_by_user_id text,
    name varchar(255) not null,
    description varchar(1000) not null,
    selling_point varchar(255),
    price double precision,
    image_url varchar(255),
    image_url2 varchar(255),
    image_url3 varchar(255),
    status varchar(255) not null default 'PENDING',
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    constraint product_status_check check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    constraint product_brand_id_fkey
        foreign key (brand_id) references public.brand_settings(id),
    constraint product_created_by_user_id_fkey
        foreign key (created_by_user_id) references public.app_user(id)
);

create table if not exists public.creative_template (
    id text primary key default gen_random_uuid()::text,
    brand_id text,
    name varchar(255) not null,
    format varchar(255) not null,
    html_path varchar(255) not null,
    thumbnail_url varchar(255),
    constraint creative_template_format_check
        check (format in ('SQUARE_POST', 'STORY', 'WHATSAPP_STATUS')),
    constraint creative_template_brand_id_fkey
        foreign key (brand_id) references public.brand_settings(id)
);

create table if not exists public.batch_job (
    id text primary key default gen_random_uuid()::text,
    brand_id text not null,
    status varchar(255) not null default 'PENDING',
    created_at timestamptz not null default now(),
    constraint batch_job_status_check
        check (status in ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
    constraint batch_job_brand_id_fkey
        foreign key (brand_id) references public.brand_settings(id)
);

create table if not exists public.post (
    id text primary key default gen_random_uuid()::text,
    product_id text not null,
    template_id text not null,
    batch_job_id text,
    format varchar(255) not null,
    image_url varchar(255),
    caption_en varchar(2000),
    caption_fr varchar(2000),
    caption_ar varchar(2000),
    caption_darija varchar(2000),
    badge_text varchar(255),
    promo_text varchar(255),
    status varchar(255) not null default 'DRAFT',
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    constraint post_format_check
        check (format in ('SQUARE_POST', 'STORY', 'WHATSAPP_STATUS')),
    constraint post_status_check
        check (status in ('DRAFT', 'APPROVED', 'EXPORTED')),
    constraint post_product_id_fkey
        foreign key (product_id) references public.product(id),
    constraint post_template_id_fkey
        foreign key (template_id) references public.creative_template(id),
    constraint post_batch_job_id_fkey
        foreign key (batch_job_id) references public.batch_job(id)
);

create table if not exists public.creative_job (
    id text primary key default gen_random_uuid()::text,
    user_id text not null,
    type varchar(32) not null,
    status varchar(32) not null default 'QUEUED',
    prompt varchar(4000) not null,
    aspect_ratio varchar(32),
    product_image_url varchar(2048),
    model_image_url varchar(2048),
    result_image_url varchar(2048),
    result_video_url varchar(2048),
    error_message varchar(1200),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint creative_job_type_check check (type in ('EDIT_IMAGE', 'PHOTO_SHOOT', 'PHOTO_SHOOT_VIDEO')),
    constraint creative_job_status_check check (status in ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    constraint creative_job_user_id_fkey foreign key (user_id) references public.app_user(id)
);

create index if not exists idx_app_user_brand_id
    on public.app_user (brand_id);

create index if not exists idx_product_brand_id
    on public.product (brand_id);

create index if not exists idx_product_created_by_user_id
    on public.product (created_by_user_id);

create index if not exists idx_product_status
    on public.product (status);

create index if not exists idx_template_brand_id
    on public.creative_template (brand_id);

create index if not exists idx_template_html_path
    on public.creative_template (html_path);

create index if not exists idx_batch_job_brand_id
    on public.batch_job (brand_id);

create index if not exists idx_batch_job_status
    on public.batch_job (status);

create index if not exists idx_post_product_id
    on public.post (product_id);

create index if not exists idx_post_template_id
    on public.post (template_id);

create index if not exists idx_post_batch_job_id
    on public.post (batch_job_id);

create index if not exists idx_post_created_at
    on public.post (created_at desc);

create index if not exists idx_creative_job_user_created
    on public.creative_job (user_id, created_at desc);

comment on table public.brand_settings is
    'STUDIO brand kit settings; the current application treats one row as the shared brand.';

comment on table public.app_user is
    'STUDIO users managed by Spring Boot JWT authentication; this is separate from auth.users.';

comment on table public.creative_template is
    'STUDIO templates; a null brand_id denotes a global template.';

commit;
