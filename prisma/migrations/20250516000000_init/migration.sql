CREATE TYPE public.order_status AS ENUM (
    'Nouveau',
    'En route',
    'Livré',
    'Annulé',
    'Retour'
);

CREATE TYPE public.user_role AS ENUM (
    'Admin',
    'Assistante',
    'Vendeuse',
    'Livreur',
    'Confirmatrice'
);

CREATE TABLE public.users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)      NOT NULL UNIQUE,
    password    TEXT             NOT NULL,
    role        public.user_role NOT NULL,
    salary      NUMERIC(10,0),
    phone       VARCHAR(10),
    active      BOOLEAN          NOT NULL DEFAULT TRUE
);

CREATE TABLE public.orders (
    id              BIGSERIAL        PRIMARY KEY,
    seller_id       INTEGER          NOT NULL,
    delivery_id     INTEGER,
    client_name     TEXT             NOT NULL,
    client_phone1   VARCHAR(15)      NOT NULL,
    client_phone2   VARCHAR(15),
    client_wilaya   VARCHAR(30),
    client_address  TEXT             NOT NULL,
    products        TEXT,
    benefit         NUMERIC(10,0),
    total           NUMERIC(10,0),
    status          public.order_status NOT NULL DEFAULT 'Nouveau',
    order_date      TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    fee             NUMERIC(5,0),
    notes           TEXT,
    return_fee      NUMERIC(5,0),
    CONSTRAINT fk_orders_seller   FOREIGN KEY (seller_id)   REFERENCES public.users(id),
    CONSTRAINT fk_orders_delivery FOREIGN KEY (delivery_id) REFERENCES public.users(id)
);
