-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.menu_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_categories_pkey PRIMARY KEY (id),
  CONSTRAINT menu_categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid,
  category_id uuid,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  is_available boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  menu_item_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid,
  table_id uuid,
  created_by uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  rejection_reason text,
  total_amount numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  promotion_id uuid,
  discount_code text,
  discount_amount numeric NOT NULL DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT orders_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id)
);
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  type text NOT NULL CHECK (type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  value numeric NOT NULL CHECK (value > 0::numeric),
  is_active boolean NOT NULL DEFAULT true,
  starts_at time without time zone,
  ends_at time without time zone,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_auto boolean,
  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  address text,
  currency text DEFAULT 'USD'::text,
  timezone text DEFAULT 'UTC'::text,
  lemonsqueezy_customer_id text,
  lemonsqueezy_subscription_id text,
  plan text DEFAULT 'trial'::text,
  trial_ends_at timestamp with time zone DEFAULT (now() + '14 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  onboarding_completed boolean DEFAULT false,
  customer_portal_url text,
  billing_type text NOT NULL DEFAULT 'manual'::text CHECK (billing_type = ANY (ARRAY['lemonsqueezy'::text, 'manual'::text])),
  plan_expires_at timestamp with time zone,
  plan_updated_by uuid,
  CONSTRAINT restaurants_pkey PRIMARY KEY (id),
  CONSTRAINT restaurants_plan_updated_by_fkey FOREIGN KEY (plan_updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.tables (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid,
  name text NOT NULL,
  qr_code_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tables_pkey PRIMARY KEY (id),
  CONSTRAINT tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  restaurant_id uuid,
  full_name text,
  role text NOT NULL DEFAULT 'admin'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  email text,
  is_super_admin boolean DEFAULT false,
  language text NOT NULL DEFAULT 'en'::text CHECK (language = ANY (ARRAY['kh'::text, 'en'::text])),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);

-- ALTER TABLE public.users
-- ADD COLUMN language text NOT NULL DEFAULT 'en'::text
-- CHECK (language = ANY (ARRAY['kh'::text, 'en'::text]));