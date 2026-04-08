--
-- PostgreSQL database dump
--

\restrict YZO3mGyLdMdoyoQz9rqR3RrvXwCFV8mmg28rF9RK8gwgDr9hFfX4GwdyYcfO9BA

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-03 18:05:46

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 861 (class 1247 OID 16687)
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'Nouveau',
    'En route',
    'Livré',
    'Annulé',
    'Retour'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- TOC entry 855 (class 1247 OID 16599)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'Admin',
    'Assistante',
    'Vendeuse',
    'Livreur'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16696)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    seller_id bigint NOT NULL,
    delivery_id bigint,
    client_name text NOT NULL,
    client_phone1 character varying(15) NOT NULL,
    client_phone2 character varying(15),
    client_wilaya character varying(30),
    client_address text NOT NULL,
    products text,
    benefit numeric(10,0),
    total numeric(10,0),
    status public.order_status DEFAULT 'Nouveau'::public.order_status NOT NULL,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fee numeric(5,0),
    notes text,
    return_fee numeric(5,0)
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16695)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- TOC entry 4930 (class 0 OID 0)
-- Dependencies: 221
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 220 (class 1259 OID 16608)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password text NOT NULL,
    role public.user_role NOT NULL,
    salary numeric(10,0),
    phone character varying(10)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16607)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4931 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4767 (class 2604 OID 16699)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 16611)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4775 (class 2606 OID 16711)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4771 (class 2606 OID 16619)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4773 (class 2606 OID 16621)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4776 (class 2606 OID 16717)
-- Name: orders fk_orders_delivery; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_delivery FOREIGN KEY (delivery_id) REFERENCES public.users(id);


--
-- TOC entry 4777 (class 2606 OID 16712)
-- Name: orders fk_orders_seller; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES public.users(id);


-- Completed on 2026-04-03 18:05:46

--
-- PostgreSQL database dump complete
--

\unrestrict YZO3mGyLdMdoyoQz9rqR3RrvXwCFV8mmg28rF9RK8gwgDr9hFfX4GwdyYcfO9BA

