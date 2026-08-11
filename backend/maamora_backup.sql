--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_user (
    id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    brand_id character varying(255),
    CONSTRAINT app_user_role_check CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying])::text[])))
);


--
-- Name: batch_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_job (
    id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    status character varying(255) NOT NULL,
    brand_id character varying(255) NOT NULL,
    CONSTRAINT batch_job_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'DONE'::character varying, 'FAILED'::character varying])::text[])))
);


--
-- Name: brand_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_settings (
    id character varying(255) NOT NULL,
    font_family character varying(255),
    logo_url character varying(255),
    name character varying(255) NOT NULL,
    primary_color character varying(255),
    secondary_color character varying(255),
    tone_guidelines character varying(2000)
);


--
-- Name: creative_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creative_template (
    id character varying(255) NOT NULL,
    format character varying(255) NOT NULL,
    html_path character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    thumbnail_url character varying(255),
    brand_id character varying(255),
    CONSTRAINT creative_template_format_check CHECK (((format)::text = ANY ((ARRAY['SQUARE_POST'::character varying, 'STORY'::character varying, 'WHATSAPP_STATUS'::character varying])::text[])))
);


--
-- Name: post; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post (
    id character varying(255) NOT NULL,
    badge_text character varying(255),
    caption_ar character varying(2000),
    caption_darija character varying(2000),
    caption_fr character varying(2000),
    created_at timestamp(6) with time zone NOT NULL,
    format character varying(255) NOT NULL,
    image_url character varying(255),
    promo_text character varying(255),
    status character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone,
    batch_job_id character varying(255),
    product_id character varying(255) NOT NULL,
    template_id character varying(255) NOT NULL,
    caption_en character varying(2000),
    CONSTRAINT post_format_check CHECK (((format)::text = ANY ((ARRAY['SQUARE_POST'::character varying, 'STORY'::character varying, 'WHATSAPP_STATUS'::character varying])::text[]))),
    CONSTRAINT post_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'APPROVED'::character varying, 'EXPORTED'::character varying])::text[])))
);


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    description character varying(1000) NOT NULL,
    image_url character varying(255),
    name character varying(255) NOT NULL,
    price double precision,
    selling_point character varying(255),
    updated_at timestamp(6) with time zone,
    brand_id character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    created_by_user_id character varying(255),
    image_url2 character varying(255),
    image_url3 character varying(255),
    CONSTRAINT product_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_user (id, created_at, email, name, password_hash, role, brand_id) FROM stdin;
5ab31c09-6288-4406-beca-33492f376870	2026-07-16 17:20:23.652965+00	berh1ayoub@gmail.com	ayoub labubu	$2a$10$3JRc/ual9tzVKbcyQjipueZFaJ/bmcsUX56fBDjL/i7j9Wbm1m.0W	USER	18ee82d1-420c-485a-ba87-722bc005b5a0
395b7cf1-8d6d-4467-9817-4e3bde460193	2026-07-21 18:42:38.503621+00	admin@gmail.com	admin	$2a$10$QvPoGIoN58hZZeBr9aA6HuKhxl5ImWlsDc5bE/O8BqL1R17e.QPga	ADMIN	18ee82d1-420c-485a-ba87-722bc005b5a0
4757d462-bc10-46c7-b8d0-78970d3890b2	2026-07-24 13:23:43.408695+00	moaad@gmail.com	moaad	$2a$10$6HkzEwuf6FFZEno8kgzMwu7mCeoA6EV6l8v70KN.09M/a0e9s9C1S	USER	18ee82d1-420c-485a-ba87-722bc005b5a0
91bd4f98-e39a-4996-b79f-0897cb9eff09	2026-08-06 23:20:40.015667+00	admin@maamora.com	Admin	$2a$10$gGarpz0VvaajKBnXk1jP/u1HTg1yEFrE0ul4vt57gfY4cUBWVU0L2	ADMIN	18ee82d1-420c-485a-ba87-722bc005b5a0
\.


--
-- Data for Name: batch_job; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.batch_job (id, created_at, status, brand_id) FROM stdin;
f48934f4-a173-4821-a2a2-1b98646f9089	2026-08-06 23:22:27.443213+00	DONE	18ee82d1-420c-485a-ba87-722bc005b5a0
39ae64ea-6ad3-4be1-a0df-f169bb3cf158	2026-08-06 23:22:58.677349+00	DONE	18ee82d1-420c-485a-ba87-722bc005b5a0
\.


--
-- Data for Name: brand_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brand_settings (id, font_family, logo_url, name, primary_color, secondary_color, tone_guidelines) FROM stdin;
18ee82d1-420c-485a-ba87-722bc005b5a0	\N	\N	Maamora	\N	\N	\N
bab48081-1416-4e4e-91f5-5b6f6456c426	\N	\N	Maamora	\N	\N	\N
\.


--
-- Data for Name: creative_template; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.creative_template (id, format, html_path, name, thumbnail_url, brand_id) FROM stdin;
e2d36b03-7565-487e-9866-3409853598f6	SQUARE_POST	bold.html	Bold Square	\N	\N
e0963119-cc8a-407b-a81a-7ed66d261831	STORY	story.html	Bold Story	\N	\N
\.


--
-- Data for Name: post; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post (id, badge_text, caption_ar, caption_darija, caption_fr, created_at, format, image_url, promo_text, status, updated_at, batch_job_id, product_id, template_id, caption_en) FROM stdin;
7d79015c-1831-4894-a82c-18d6da5ee170	-20% TODAY	\N	\N	\N	2026-07-21 18:44:16.402051+00	STORY	http://localhost:8080/files/posts/5a92b722-4e5b-42fa-ac42-7e03c3dd9989.png	OFFRE SPÉCIALE !	DRAFT	2026-07-21 18:44:16.402051+00	\N	e0d3c5f4-7ae0-425d-963b-db3321d1ab95	e0963119-cc8a-407b-a81a-7ed66d261831	\N
ff2b33a6-7a1a-480e-9f41-c531a8d1aac1	-20% TODAY	\N	about this classic shoes	\N	2026-07-21 18:44:57.443686+00	SQUARE_POST	http://localhost:8080/files/posts/99639448-87f3-4b44-8337-790887dbb896.png	OFFRE SPÉCIALE !	DRAFT	2026-07-21 18:45:26.185397+00	\N	e0d3c5f4-7ae0-425d-963b-db3321d1ab95	e2d36b03-7565-487e-9866-3409853598f6	\N
d250d054-34b6-4538-bc68-df75fc8c671f	-20% TODAY	\N	\N	\N	2026-07-21 20:48:20.88625+00	SQUARE_POST	http://localhost:8080/files/posts/96547fd3-07f7-461f-830e-e8936bfa953c.png	OFFRE SPÉCIALE !	DRAFT	2026-07-21 20:48:20.88625+00	\N	e0d3c5f4-7ae0-425d-963b-db3321d1ab95	e2d36b03-7565-487e-9866-3409853598f6	\N
2205f312-4376-4ac3-a675-c47bd39247d1	-20% TODAY	\N	\N	\N	2026-07-21 20:51:00.673784+00	SQUARE_POST	http://localhost:8080/files/posts/de2c05d3-7124-46f9-a7cc-463413f73306.png	OFFRE SPÉCIALE !	DRAFT	2026-07-21 20:51:19.564893+00	\N	66cb523e-b84c-454e-8781-fe96fe6e2f31	e2d36b03-7565-487e-9866-3409853598f6	labubu
78576e84-f24a-46f7-95e4-297a97685d21	-20% TODAY	انطلق بثقة ونشاط كل يوم مع حذاء الجري الكلاسيكي من معمورة! 🏃‍♂️✨\n\nصُمم لتدريباتك اليومية بخفة وراحة لا تُضاهى؛ يتميز بشبكة فائقة التهوية ودعم مقوّى للكعب ليمنحك أقصى درجات الثبات والاستجابة في كل خطوة.\n\n💰 السعر: 349 درهم فقط!\n\n🛍️ اطلبه الآن وارتقِ بلياقتك اليوم!\n\n#معمورة #حذاء_جري #رياضة_المغرب	باغي ترينّي كل نهار بلا ما تعيا ولا تسخن رجلك؟ 👟\nهاد الصباط خفيف بزاف، فيه شبكة كتهوّي الرجل ودعم صحيح فالعرقوب باش تجري وانت مرتاح.\nغير بـ 349 درهم فقط! 💥\nالكمية محدودة، كوموندي ديالك دابا قبل ما يسلاو 🚀\n\n#مامورة #صباط_رياضي #جري_فالمغرب	Prêt(e) à booster tes runs quotidiens ? 🏃‍♂️💨\n\nDécouvre les Classic Running Shoes de Maamora : ultra-respirantes avec leur mesh aéré, et dotées d'un maintien renforcé du talon pour courir en toute légèreté ! 🔥\n\nShoppe la tienne à seulement 349 DH. Commandes en DM ou via le lien en bio ! 📲\n\n#Maamora #RunningMaroc #SneakersMaroc	2026-07-21 20:57:08.896998+00	STORY	http://localhost:8080/files/posts/a21a4106-38f1-445c-9344-6abeca7fe4f1.png	OFFRE SPÉCIALE !	APPROVED	2026-07-21 20:58:05.883538+00	\N	e0d3c5f4-7ae0-425d-963b-db3321d1ab95	e0963119-cc8a-407b-a81a-7ed66d261831	Ready to crush your daily runs? 🏃‍♂️✨\n\nMeet the Maamora Classic Running Shoes—lightweight, cushioned, and designed with ultra-breathable mesh and reinforced heel support for ultimate comfort on every stride.\n\nGrab yours today for just 349 MAD! 🛍️\n\n#Maamora #RunningShoes #MoroccoFit
183256ef-5db5-430a-b06f-cea2091b3e21	-20% TODAY	\N	\N	\N	2026-07-21 20:58:44.809193+00	STORY	http://localhost:8080/files/posts/ce14eb01-42f3-4d1e-8b6b-6fae60968024.png	OFFRE SPÉCIALE !	DRAFT	2026-07-21 20:58:44.809193+00	\N	99391028-f815-45c7-a574-4647816d39b3	e0963119-cc8a-407b-a81a-7ed66d261831	\N
ef27d384-4af8-4a12-8f6a-0f21c052a192	-20% TODAY	جاهزون للأفضل؟ ⚡️\n\nاكتشفوا "لابوبو" المميز من مأمورة! 🌟\nمقاوم للماء 💦 وببطارية قوية تدوم حتى 100 ساعة من التشغيل المتواصل! 🔋\n\nاحصلوا عليه الآن بسعر 1000 درهم مغربي فقط! 🛒\n\n#مأمورة #لابوبو #المغرب	باغي لابوبو اللي يصحّ معاك وما يطفيش؟ هاد الموديل الجديد من Maamora مقاوم للماء والباتري ديالو كيدوز حتى لـ100 ساعة د الخدمة بلا قطع! \n\nالثمن غير بـ1000 درهم فقط. الكمية محدودة بزاف، كوموندي دابا قبل ما تسالى 🚀✨\n\n#Maamora #Labubu #Morocco	Prêts à adopter votre nouveau Labubu avec Maamora ? 🌟\n\n100% étanche 💧 et armé d'une batterie imbattable de 100h 🔋, il est taillé pour toutes vos aventures ! \n\nDisponible dès maintenant pour seulement 1000 MAD. Commandez le vôtre avant rupture de stock ! 🔥\n\n#Maamora #Labubu #Maroc	2026-07-24 00:33:48.527195+00	SQUARE_POST	https://res.cloudinary.com/maamora/image/upload/v1784853226/posts/aa99678e-fbf4-45be-a2b1-fd8c8276ae64.png	OFFRE SPÉCIALE !	APPROVED	2026-07-24 00:34:32.87418+00	\N	0ec0f1f4-eb8a-4c50-9ded-0eb3ba5c9e08	e2d36b03-7565-487e-9866-3409853598f6	Meet your new ultimate companion: Labubu! 🌟 Built waterproof and powered by a massive 100-hour battery, it's ready to power through all your daily adventures. Get yours today for just 1000 MAD! 🛍️✨\n\n#Maamora #Labubu #Morocco
e3b2216a-8e50-40aa-8bfe-5bb3e3371bef	-20% TODAY	\N	\N	\N	2026-07-24 12:35:27.375312+00	SQUARE_POST	https://res.cloudinary.com/maamora/image/upload/v1784896527/posts/a786f0fa-f638-41c8-a9bc-2d1e0cd6a8fb.png	OFFRE SPÉCIALE !	DRAFT	2026-07-24 12:35:27.375312+00	\N	e777bc1c-49a5-4c50-9377-7b0d5be1e13e	e2d36b03-7565-487e-9866-3409853598f6	\N
c048e244-7146-4627-9dcd-3863836065d6	-20% TODAY	\N	\N	\N	2026-07-24 12:35:41.494409+00	SQUARE_POST	https://res.cloudinary.com/maamora/image/upload/v1784896542/posts/72d73029-17b3-48cf-ae9d-e83b0ed7f99a.png	OFFRE SPÉCIALE !	DRAFT	2026-07-24 12:35:41.494409+00	\N	e777bc1c-49a5-4c50-9377-7b0d5be1e13e	e2d36b03-7565-487e-9866-3409853598f6	\N
00e15cf1-a3dc-494a-9efc-7c57a3ea0d4c	-20% TODAY	انطلق بثقة وطاقة كل يوم مع حذاء الجري الكلاسيكي من معمورة! 👟✨\n\nخفيف الوزن ومثالي لتمارينك اليومية، يتميز بقماش شبكي فائق التهوية ودعم مُعزز للكعب يمنحك الراحة والثبات في كل خطوة.\n\nالسعر: 349 درهم مغربي فقط! \n\nاطلبه الآن وابدأ رحلتك الرياضية! 🛍️\n\n#معمورة #حذاء_جري #رياضة_اليوم	باغي تجري بلا ما تعرق ولا تضرّك رجلك؟ 🏃‍♂️\nهاد الصباط خفيف بزاف، الشبكة ديالو ككتنفس وكيشد الكعب مزيان باش تجري مرتاح فكل خطوة.\nغير بـ 349 درهم! \nدوز الكوماند دابا قبل ما تسالى السلعة 🚀\n\n#مامورة #جري #سبور_المغرب	Booste tes runs quotidiens avec les Classic Running Shoes Maamora ! 🏃‍♂️⚡️\n\nConçues pour allier légèreté et performance, elles t'accompagnent à chaque foulée grâce à leur mesh ultra-respirant et un maintien du talon renforcé. Un confort absolu et un amorti réactif pour dépasser tes objectifs ! 👟✨\n\n🔥 Prix spécial : 349 MAD 🇲🇦\n🛍️ Disponible dès maintenant !\n\n#Maamora #RunningMaroc #SportStyle	2026-07-24 13:11:04.482482+00	SQUARE_POST	https://res.cloudinary.com/maamora/image/upload/v1784898664/posts/e6b213d5-7875-4369-befb-3cd504216d12.png	OFFRE SPÉCIALE !	APPROVED	2026-07-24 13:18:59.563214+00	\N	e777bc1c-49a5-4c50-9377-7b0d5be1e13e	e2d36b03-7565-487e-9866-3409853598f6	Ready to level up your daily runs? 🏃‍♂️\n\nMeet the Maamora Classic Running Shoes — built with ultra-breathable mesh to keep you cool and reinforced heel support for maximum stability on every stride. Lightweight, responsive comfort made for your everyday hustle.\n\nGet yours today for just 349 MAD! 👟\n\n#Maamora #RunningShoes #MoroccanBrand
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product (id, created_at, description, image_url, name, price, selling_point, updated_at, brand_id, status, created_by_user_id, image_url2, image_url3) FROM stdin;
e777bc1c-49a5-4c50-9377-7b0d5be1e13e	2026-07-21 18:38:56.475536+00	Lightweight running shoes built for daily training, with a breathable mesh upper and a responsive cushioned sole.	https://picsum.photos/seed/maamora-shoes/800/800	Classic Running Shoes	349	Ultra-breathable mesh, reinforced heel support	2026-07-21 18:38:56.475536+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	\N	\N	\N
c0cab19a-5a5b-444a-b231-5146491faf9d	2026-07-21 18:38:56.504558+00	A 6mm non-slip yoga mat with printed alignment guides, ideal for yoga, Pilates, and home workouts.	https://picsum.photos/seed/maamora-mat/800/800	Performance Yoga Mat	199	Non-slip, eco-friendly material with carry strap	2026-07-21 18:38:56.504558+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	\N	\N	\N
d6d30918-a02b-4c56-813d-79e44cef49f1	2026-07-21 18:38:56.506555+00	Sweat and splash resistant wireless earbuds with deep bass and up to 32 hours of battery life with the charging case.	https://picsum.photos/seed/maamora-earbuds/800/800	Wireless Sport Earbuds	449	32-hour battery life, IPX5 water resistance	2026-07-21 18:38:56.506555+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	\N	\N	\N
64e94eb0-6e1e-4461-ae83-7fdf299ca748	2026-07-21 18:38:56.508555+00	Double-wall stainless steel bottle that keeps drinks cold for 24 hours or hot for 12, perfect for daily workouts.	https://picsum.photos/seed/maamora-bottle/800/800	Insulated Water Bottle	129	Keeps drinks cold 24h / hot 12h	2026-07-21 18:38:56.508555+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	\N	\N	\N
fd47b6f7-a564-49bd-b640-275061b23438	2026-07-21 18:38:56.509556+00	A durable, water-resistant backpack with a padded laptop sleeve and a dedicated shoe compartment.	https://picsum.photos/seed/maamora-backpack/800/800	Everyday Sport Backpack	299	Water-resistant, padded laptop compartment	2026-07-21 18:38:56.509556+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	\N	\N	\N
e0d3c5f4-7ae0-425d-963b-db3321d1ab95	2026-07-21 18:42:38.516619+00	Lightweight running shoes built for daily training, with a breathable mesh upper and a responsive cushioned sole.	https://picsum.photos/seed/maamora-shoes/800/800	Classic Running Shoes	349	Ultra-breathable mesh, reinforced heel support	2026-07-21 18:42:38.516619+00	bab48081-1416-4e4e-91f5-5b6f6456c426	APPROVED	\N	\N	\N
880144c7-8433-40b9-99a6-7760501d97e2	2026-07-21 18:42:38.516619+00	A 6mm non-slip yoga mat with printed alignment guides, ideal for yoga, Pilates, and home workouts.	https://picsum.photos/seed/maamora-mat/800/800	Performance Yoga Mat	199	Non-slip, eco-friendly material with carry strap	2026-07-21 18:42:38.516619+00	bab48081-1416-4e4e-91f5-5b6f6456c426	APPROVED	\N	\N	\N
66cb523e-b84c-454e-8781-fe96fe6e2f31	2026-07-21 18:42:38.516619+00	Sweat and splash resistant wireless earbuds with deep bass and up to 32 hours of battery life with the charging case.	https://picsum.photos/seed/maamora-earbuds/800/800	Wireless Sport Earbuds	449	32-hour battery life, IPX5 water resistance	2026-07-21 18:42:38.516619+00	bab48081-1416-4e4e-91f5-5b6f6456c426	APPROVED	\N	\N	\N
24f07da2-cf1c-4ff6-8a68-89eacd6cc7b9	2026-07-21 18:42:38.517294+00	Double-wall stainless steel bottle that keeps drinks cold for 24 hours or hot for 12, perfect for daily workouts.	https://picsum.photos/seed/maamora-bottle/800/800	Insulated Water Bottle	129	Keeps drinks cold 24h / hot 12h	2026-07-21 18:42:38.517294+00	bab48081-1416-4e4e-91f5-5b6f6456c426	APPROVED	\N	\N	\N
99391028-f815-45c7-a574-4647816d39b3	2026-07-21 18:42:38.517294+00	A durable, water-resistant backpack with a padded laptop sleeve and a dedicated shoe compartment.	https://picsum.photos/seed/maamora-backpack/800/800	Everyday Sport Backpack	299	Water-resistant, padded laptop compartment	2026-07-21 18:42:38.517294+00	bab48081-1416-4e4e-91f5-5b6f6456c426	APPROVED	\N	\N	\N
fe669ab4-6409-45d1-8934-cb5ab1a2ea9a	2026-07-21 22:00:44.862941+00	nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger 	https://res.cloudinary.com/maamora/image/upload/v1784671234/products/ed01cd5a-cf3a-4775-8b73-b8d04b5c0457.jpg	Labubu	100	waterproof , labubu , battery 100h	2026-07-21 22:02:45.27632+00	bab48081-1416-4e4e-91f5-5b6f6456c426	REJECTED	\N	\N	\N
01112455-2eba-412a-a31b-1657c5694f40	2026-07-21 22:02:11.635291+00	nigger nigger nigger nigger nigger nigger nigger nigger nigger 	https://res.cloudinary.com/maamora/image/upload/v1784671328/products/7b5eb473-4052-4f7c-8bb1-c9c74601568f.jpg	Labubu	250	waterproof , labubu , battery 100h	2026-07-21 22:02:47.640899+00	bab48081-1416-4e4e-91f5-5b6f6456c426	APPROVED	\N	\N	\N
6bb65b89-1770-4da9-80b9-6e4e36f7f5e1	2026-07-22 13:01:53.923547+00	nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger 		IFRAN	500	waterproof , labubu , battery 100h	2026-07-22 13:01:53.923547+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	395b7cf1-8d6d-4467-9817-4e3bde460193	\N	\N
0ec0f1f4-eb8a-4c50-9ded-0eb3ba5c9e08	2026-07-24 00:33:06.98562+00	NIGGER NIGGER NIGGER NIGGER NIGGER NIGGER NIGGER 	https://res.cloudinary.com/maamora/image/upload/v1784853180/products/b3dc8bcf-93ed-424a-966f-d474561ceb9e.jpg	Labubu	1000	waterproof , labubu , battery 100h	2026-07-24 00:33:06.98562+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	395b7cf1-8d6d-4467-9817-4e3bde460193	\N	\N
70eb096d-7e2d-4ed7-ace4-1faa7a264593	2026-07-24 13:21:06.169329+00	https://www.maamora.ma 		morafrifo labubu	100	waterproof , labubu , battery 100h	2026-07-24 13:25:35.465561+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	5ab31c09-6288-4406-beca-33492f376870	https://res.cloudinary.com/maamora/image/upload/v1784899262/products/efae08c1-3731-4a9f-a4ae-080e221d4d8c.jpg	https://res.cloudinary.com/maamora/image/upload/v1784899249/products/a54d6cdb-3d09-4e1e-be21-8c9dff5d62ae.jpg
9ec48172-42ad-430e-a158-489292939cac	2026-08-06 23:21:44.682428+00	يشصيشصييشصبقصشبيش\\ب\\سبسيب\\سيب\\سيب	https://res.cloudinary.com/maamora/image/upload/v1786058501/products/820bce6d0f084cbea6f8374e1bc1acd8f5a342eace8b568ac0923c57a7bdfb53.jpg	AYOUB BARHOINE	1000	waterproof , labubu , battery 100h	2026-08-06 23:21:44.682428+00	18ee82d1-420c-485a-ba87-722bc005b5a0	APPROVED	395b7cf1-8d6d-4467-9817-4e3bde460193		
\.


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- Name: batch_job batch_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_job
    ADD CONSTRAINT batch_job_pkey PRIMARY KEY (id);


--
-- Name: brand_settings brand_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_pkey PRIMARY KEY (id);


--
-- Name: creative_template creative_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creative_template
    ADD CONSTRAINT creative_template_pkey PRIMARY KEY (id);


--
-- Name: post post_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT post_pkey PRIMARY KEY (id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: app_user uk1j9d9a06i600gd43uu3km82jw; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT uk1j9d9a06i600gd43uu3km82jw UNIQUE (email);


--
-- Name: product fk3r5v42filbvg4ni14loi8a3nb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT fk3r5v42filbvg4ni14loi8a3nb FOREIGN KEY (brand_id) REFERENCES public.brand_settings(id);


--
-- Name: post fk66n57oi91ho14nfxbqt7jxtb0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT fk66n57oi91ho14nfxbqt7jxtb0 FOREIGN KEY (template_id) REFERENCES public.creative_template(id);


--
-- Name: app_user fk9py2u33i3mnad933yiwgoxuhs; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT fk9py2u33i3mnad933yiwgoxuhs FOREIGN KEY (brand_id) REFERENCES public.brand_settings(id);


--
-- Name: post fkftoyffkwxvpplkysgbs77ftvi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT fkftoyffkwxvpplkysgbs77ftvi FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: batch_job fkglhd9pepj75yykyss8ltb95ib; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_job
    ADD CONSTRAINT fkglhd9pepj75yykyss8ltb95ib FOREIGN KEY (brand_id) REFERENCES public.brand_settings(id);


--
-- Name: post fkj6jjldmu0n4ps9jkgat72hr5m; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT fkj6jjldmu0n4ps9jkgat72hr5m FOREIGN KEY (batch_job_id) REFERENCES public.batch_job(id);


--
-- Name: creative_template fkjg2lf2cbxj9ivyw3qnwxt3795; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creative_template
    ADD CONSTRAINT fkjg2lf2cbxj9ivyw3qnwxt3795 FOREIGN KEY (brand_id) REFERENCES public.brand_settings(id);


--
-- Name: product fkn8r3qrcsu5t2uxtk4thbh5fc1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT fkn8r3qrcsu5t2uxtk4thbh5fc1 FOREIGN KEY (created_by_user_id) REFERENCES public.app_user(id);


--
-- PostgreSQL database dump complete
--

