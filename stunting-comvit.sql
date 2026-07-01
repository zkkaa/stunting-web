-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.DataAnak (
  nik character varying NOT NULL,
  no_kk character varying,
  tanggal_lahir date,
  tempat_lahir character varying,
  gender USER-DEFINED,
  umur_tahun smallint,
  bb_lahir real,
  tb_lahir real,
  lk_lahir real,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  nama character varying,
  aktif boolean DEFAULT true,
  image_anak text,
  umur_bulan smallint,
  CONSTRAINT DataAnak_pkey PRIMARY KEY (nik),
  CONSTRAINT DataAnak_no_kk_fkey FOREIGN KEY (no_kk) REFERENCES public.DataKeluarga(no_kk)
);
CREATE TABLE public.DataKeluarga (
  no_kk character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT DataKeluarga_pkey PRIMARY KEY (no_kk)
);
CREATE TABLE public.Alamat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provinsi character varying,
  kota character varying,
  kecamatan character varying,
  desa character varying,
  jalan character varying,
  kode_pos character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  no_kk character varying,
  updated_at date,
  CONSTRAINT Alamat_pkey PRIMARY KEY (id),
  CONSTRAINT Alamat_no_kk_fkey FOREIGN KEY (no_kk) REFERENCES public.DataKeluarga(no_kk)
);
CREATE TABLE public.DataOrangTua (
  nik character varying NOT NULL,
  nama character varying,
  tanggal_lahir date,
  tempat_lahir character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  no_kk character varying,
  role USER-DEFINED,
  no_hp character varying,
  image_orangtua text,
  updated_at date,
  CONSTRAINT DataOrangTua_pkey PRIMARY KEY (nik),
  CONSTRAINT DataOrangTua_no_kk_fkey FOREIGN KEY (no_kk) REFERENCES public.DataKeluarga(no_kk)
);
CREATE TABLE public.Analisis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nik character varying,
  tinggi real,
  berat real,
  status_berat character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image text,
  status_tinggi text,
  status character varying,
  CONSTRAINT Analisis_pkey PRIMARY KEY (id),
  CONSTRAINT Analisis_nik_fkey FOREIGN KEY (nik) REFERENCES public.DataAnak(nik)
);
CREATE TABLE public.User (
  id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  name text UNIQUE,
  username character varying UNIQUE,
  email character varying UNIQUE,
  no_hp character varying,
  password text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  profile_image text,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.TempAnalisis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nik character varying,
  tinggi real,
  berat real,
  status character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image text,
  CONSTRAINT TempAnalisis_pkey PRIMARY KEY (id),
  CONSTRAINT TempAnalisis_nik_fkey FOREIGN KEY (nik) REFERENCES public.DataAnak(nik)
);
CREATE TABLE public.Konsultasi (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role character varying,
  content text,
  user_id character varying,
  CONSTRAINT Konsultasi_pkey PRIMARY KEY (id)
);