-- SQL SEED FILE FOR LELA STORE (SUPABASE)
-- Copy and run this script in your Supabase SQL Editor to seed the database with required default values.

-- 1. Seed Settings Table
INSERT INTO settings (key, value) VALUES
('homepage', '{
  "hero": {
    "title": {
      "en": "Shopping from Egypt. Shipping to Yemen.",
      "ar": "تسوقي من مصر. الشحن لليمن."
    },
    "subtitle": {
      "en": "LELA is your premium personal shopping concierge. We acquire luxury products, fashion, and personal care from Cairo and deliver directly to your doorstep in Yemen.",
      "ar": "ليلا هي رفيقة تسوقك الشخصية الفاخرة. نوفر لكِ مستحضرات التجميل، الأزياء، والمنتجات المنزلية من القاهرة ونوصلها مباشرة إلى باب بيتكِ في اليمن."
    }
  },
  "whyLela": [
    {
      "id": "w1",
      "icon": "Sparkles",
      "title": {
        "en": "Premium Curation",
        "ar": "اختيارات فاخرة"
      },
      "description": {
        "en": "Only authentic items sourced directly from flagship brands like Dior, Zara, and official channels in Egypt.",
        "ar": "منتجات أصلية فقط نوفرها مباشرة من الفروع الرئيسية لعلامات مثل ديور، زارا والوكلاء الرسميين في مصر."
      }
    },
    {
      "id": "w2",
      "icon": "ShieldCheck",
      "title": {
        "en": "Secure Packaging & Shipping",
        "ar": "تغليف وشحن آمن"
      },
      "description": {
        "en": "Double-reinforced luxurious packaging to ensure fragile items arrive in perfect condition.",
        "ar": "تغليف فاخر ومزدوج الحماية لضمان وصول المقتنيات القابلة للكسر في حالة ممتازة تماماً."
      }
    },
    {
      "id": "w3",
      "icon": "Coins",
      "title": {
        "en": "Fair Exchange Rates",
        "ar": "أسعار صرف عادلة"
      },
      "description": {
        "en": "We compute values transparently into Yemeni Rial (YER) using active, fair market conversion.",
        "ar": "نحتسب القيمة بكل شفافية بالريال اليمني بناءً على أسعار صرف السوق النشطة والعادلة."
      }
    },
    {
      "id": "w4",
      "icon": "Truck",
      "title": {
        "en": "Yemen-Wide Delivery",
        "ar": "توصيل لكافة مناطق اليمن"
      },
      "description": {
        "en": "From major hubs like Sana''a and Aden to smaller governorates, our network spans the entire country.",
        "ar": "من المدن الرئيسية كصنعاء وعدن إلى كافة المحافظات والمناطق اليمنية، تغطي شبكتنا البلد بأكمله."
      }
    }
  ],
  "howItWorks": [
    {
      "step": 1,
      "title": {
        "en": "Select Products",
        "ar": "اختاري المنتجات"
      },
      "description": {
        "en": "Browse products on our store or send custom requests for items available in Egypt.",
        "ar": "تصفحي المنتجات المتوفرة على موقعنا أو أرسلي طلبات خاصة لأي سلعة متوفرة في مصر."
      }
    },
    {
      "step": 2,
      "title": {
        "en": "We Purchase for You",
        "ar": "نقوم بالشراء نيابة عنكِ"
      },
      "description": {
        "en": "Our team buys the exact products in Cairo, checking quality and packaging securely.",
        "ar": "يقوم فريقنا بشراء السلع المطلوبة من القاهرة مع فحص الجودة وتغليفها بأمان."
      }
    },
    {
      "step": 3,
      "title": {
        "en": "Receive in Yemen",
        "ar": "الاستلام في اليمن"
      },
      "description": {
        "en": "Your box is shipped across borders directly to your governorate in Yemen.",
        "ar": "يتم شحن طلبيتكِ عبر الحدود وتوصيلها مباشرة إلى محافظتكِ في اليمن."
      }
    }
  ]
}'::jsonb),

('shippingRates', '{
  "personalCare": 450,
  "clothingHome": 300,
  "defaultWeight": 0.5
}'::jsonb),

('currency', '{
  "egpToYerRate": 11.5,
  "yerToSarRate": 140
}'::jsonb),

('contactInfo', '{
  "phoneEgypt": "+201557179009",
  "phoneYemen": "+967784990676",
  "email": "lela.storex@gmail.com",
  "instagram": "https://instagram.com/lela_e0",
  "facebook": "https://facebook.com/lela.e0",
  "whatsappEgypt": "https://wa.me/201557179009",
  "whatsappYemen": "https://wa.me/967784990676"
}'::jsonb),

('branding', '{
  "logoUrl": "",
  "logoDarkUrl": "",
  "faviconUrl": "",
  "loadingLogoUrl": "",
  "browserIconUrl": "",
  "websiteName": "LELA Store",
  "primaryColor": "#8A3D5A",
  "secondaryColor": "#E3B8AE",
  "backgroundColor": "#FFF9F7",
  "textColor": "#3A2A30"
}'::jsonb),

('theme', '{
  "primaryColor": "#8A3D5A",
  "secondaryColor": "#E3B8AE",
  "accentColor": "#D7A5AE",
  "backgroundColor": "#FFF9F7",
  "textColor": "#3A2A30",
  "darkPrimaryColor": "#8A3D5A",
  "darkSecondaryColor": "#E3B8AE",
  "darkAccentColor": "#D7A5AE",
  "darkBackgroundColor": "#0F172A",
  "darkTextColor": "#FFFFFF",
  "buttonRadius": "12px",
  "borderWidth": "1px",
  "cardBg": "#FFFFFF",
  "darkCardBg": "#1E293B"
}'::jsonb),

('seoSettings', '{
  "title": "LELA Store - Premium Personal Shopping Concierge",
  "description": "LELA is your luxury concierge service: We buy fashion, makeup, and home products from Cairo flagship stores and ship to all governorates in Yemen.",
  "keywords": "Yemen shopping, Cairo to Sanaa, cosmetics Yemen, LELA store, luxury concierge Yemen"
}'::jsonb),

('maintenanceMode', 'false'::jsonb),
('announcements', '[]'::jsonb)

ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();


-- 2. Seed Categories Table
INSERT INTO categories (id, name, image, "order", hidden) VALUES
('personal-care', '{"en": "Personal Care", "ar": "العناية الشخصية"}'::jsonb, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400', 1, false),
('clothing', '{"en": "Clothing & Fashion", "ar": "الملابس والأزياء"}'::jsonb, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400', 2, false),
('home-products', '{"en": "Home Products", "ar": "المنتجات المنزلية"}'::jsonb, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400', 3, false)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, image = EXCLUDED.image, "order" = EXCLUDED.order, hidden = EXCLUDED.hidden;


-- 3. Seed Coupons Table
INSERT INTO coupons (code, discount_type, discount_value, expiration_date, max_uses, used_count, min_order_value, active) VALUES
('LELA10', 'percentage', 10, '2026-12-31', 1000, 0, 0, true),
('WELCOME50', 'fixed', 50, '2026-12-31', 500, 0, 500, true)
ON CONFLICT (code) DO UPDATE
SET discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value, expiration_date = EXCLUDED.expiration_date, max_uses = EXCLUDED.max_uses, active = EXCLUDED.active;


-- 4. Seed FAQs Table (Using valid UUIDs: hexadecimal characters only)
INSERT INTO faqs (id, question, answer) VALUES
('f0000000-0000-0000-0000-000000000001', 
 '{"en": "How does LELA shopping concierge work?", "ar": "كيف تعمل خدمة التسوق والمشتريات من ليلا؟"}'::jsonb, 
 '{"en": "Simply choose products from our website or send us links to any items you want from online or physical stores in Egypt. We purchase them on your behalf, bundle them carefully, and ship them directly to your address in Yemen.", "ar": "ببساطة اختر المنتجات من موقعنا أو أرسل لنا روابط أي سلع تريدها من المتاجر الإلكترونية أو العادية في مصر. نحن نقوم بشرائها نيابة عنك وتغليفها بعناية وشحنها مباشرة إلى عنوانك في اليمن."}'::jsonb),

('f0000000-0000-0000-0000-000000000002', 
 '{"en": "What are the shipping rates and calculations?", "ar": "ما هي أسعار وطريقة احتساب الشحن؟"}'::jsonb, 
 '{"en": "Shipping is calculated based on the weight and category of your items: Personal Care is 450 EGP per KG, while Clothing and Home Products are 300 EGP per KG. You can use our live Shipping Calculator to get estimates in Yemeni Rial (YER).", "ar": "يتم احتساب الشحن بناءً على وزن وتصنيف المواد: العناية الشخصية 450 جنيه مصري للكيلو جرام، بينما الملابس والمنتجات المنزلية 300 جنيه مصري للكيلو جرام. يمكنك استخدام حاسبة الشحن التفاعلية للحصول على التقديرات بالريال اليمني."}'::jsonb),

('f0000000-0000-0000-0000-000000000003', 
 '{"en": "Which governorates in Yemen do you ship to?", "ar": "ما هي المحافظات اليمنية التي تشحنون إليها؟"}'::jsonb, 
 '{"en": "We ship to all governorates in Yemen, including Sana''a, Aden, Taiz, Ibb, Hadhramaut, and others. Delivery is coordinated locally through trusted distribution partners.", "ar": "نشحن إلى كافة المحافظات اليمنية بما فيها صنعاء، عدن، تعز، إب، حضرموت وغيرها. ويتم تنسيق التوصيل محلياً من خلال شركاء توزيع موثوقين."}'::jsonb),

('f0000000-0000-0000-0000-000000000004', 
 '{"en": "How do I pay for my orders?", "ar": "كيف يمكنني الدفع مقابل طلبي؟"}'::jsonb, 
 '{"en": "We accept local payment transfers in Yemen (such as Kuraimi, Al-Najm, Kuraimi Express) as well as cash on delivery in select cities, or payment via binance/crypto. Contact our support via WhatsApp to confirm the payment method.", "ar": "نقبل الحوالات المالية المحلية في اليمن (مثل الكريمي، النجم، الكريمي إكسبرس) بالإضافة إلى الدفع عند الاستلام في مدن محددة، أو الدفع عبر Binance. تواصل مع الدعم الفني عبر الواتساب لتأكيد طريقة الدفع."}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET question = EXCLUDED.question, answer = EXCLUDED.answer;


-- 5. Seed Reviews Table (Using valid UUIDs: hexadecimal characters only)
INSERT INTO reviews (id, name, rating, date, comment, avatar) VALUES
('b0000000-0000-0000-0000-000000000001', 'Arwa A.', 5, '2026-06-15', 
 '{"en": "LELA has completely transformed how I shop. I ordered cosmetics from Egypt, and they arrived perfectly packaged in Sana''a! The shipping cost was calculated instantly.", "ar": "غيرت ليلا طريقة تسوقي تماماً. طلبت مستحضرات تجميل من مصر، ووصلت مغلفة بشكل ممتاز إلى صنعاء! تكلفة الشحن حُسبت فوراً وبكل مصداقية."}'::jsonb, 
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'),

('b0000000-0000-0000-0000-000000000002', 'Fatima M.', 5, '2026-06-28', 
 '{"en": "I bought the Zara wool coat. Exceptional service! The concierge took care of everything from buying in Cairo to delivery in Aden. Worth every Yemeni Rial.", "ar": "اشتريت معطف زارا الصوفي. خدمة استثنائية! تولى القائمون على الخدمة كل شيء من الشراء في القاهرة وحتى التوصيل في عدن. تستحق كل ريال يمني."}'::jsonb, 
 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'),

('b0000000-0000-0000-0000-000000000003', 'Khaled Y.', 5, '2026-07-02', 
 '{"en": "Super professional. I wanted to buy AirPods Pro 2 from Egypt during the discounts, and LELA delivered them safely and fast. Best shopping service for Yemen.", "ar": "قمة في الاحترافية. أردت شراء سماعات AirPods Pro 2 من مصر خلال فترة الخصومات، وقامت ليلا بتوصيلها بأمان وسرعة. أفضل خدمة تسوق لليمن."}'::jsonb, 
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, rating = EXCLUDED.rating, date = EXCLUDED.date, comment = EXCLUDED.comment, avatar = EXCLUDED.avatar;


-- 6. Seed Products Table (Using valid UUIDs: hexadecimal characters only)
INSERT INTO products (id, name, description, category, cost_egp, profit_egp, price_egp, weight, images, featured, sizes, colors, variants, stock, status, tags, rating, reviews_count, discount_type, discount_value) VALUES
('a0000000-0000-0000-0000-000000000001', 
 '{"en": "Dior Addict Lip Glow Oil", "ar": "زيت شفاه ديور أديكت ليب جلو"}'::jsonb, 
 '{"en": "The Dior Addict Lip Glow Lip Balm is formulated with 97% natural-origin ingredients. It subtly revives the natural color of lips with a custom glow.", "ar": "مرطب الشفاه ديور أديكت ليب جلو بتركيبة تحتوي على 97% من المكونات الطبيعية. يبرز لون الشفاه الطبيعي مع لمعان مخصص."}'::jsonb, 
 'personal-care', 2000, 400, 2400, 0.1, 
 '["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400"]'::jsonb, 
 true, '[]'::jsonb, '["001 Pink", "004 Coral", "012 Rosewood"]'::jsonb, 
 '[{"name": "Color", "options": ["001 Pink", "004 Coral", "012 Rosewood"]}]'::jsonb, 
 25, 'visible', '["Featured", "New"]'::jsonb, 5.0, 18, 'none', 0),

('a0000000-0000-0000-0000-000000000002', 
 '{"en": "Zara Double-Breasted Wool Coat", "ar": "معطف زارا صوف مزدوج الصدر"}'::jsonb, 
 '{"en": "Double-breasted coat made of a wool blend. Lapel collar and long sleeves. Front welt pockets. Double-breasted button fastening.", "ar": "معطف مزدوج الصدر مصنوع من مزيج الصوف. ياقة بطية صدر وأكمام طويلة. جيوب أمامية. إغلاق بأزرار مزدوجة."}'::jsonb, 
 'clothing', 3500, 700, 4200, 1.2, 
 '["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400"]'::jsonb, 
 true, '["S", "M", "L", "XL"]'::jsonb, '["Black", "Camel"]'::jsonb, 
 '[{"name": "Size", "options": ["S", "M", "L", "XL"]}, {"name": "Color", "options": ["Black", "Camel"]}]'::jsonb, 
 8, 'visible', '["Best Seller"]'::jsonb, 5.0, 6, 'percentage', 10),

('a0000000-0000-0000-0000-000000000003', 
 '{"en": "Apple AirPods Pro 2", "ar": "سماعات أبل إيربودز برو 2"}'::jsonb, 
 '{"en": "AirPods Pro 2 feature up to 2x more Active Noise Cancellation, plus Adaptive Audio and Transparency mode.", "ar": "تتميز سماعات AirPods Pro 2 بميزة إلغاء الضوضاء النشط بما يصل إلى ضعفين، بالإضافة إلى الصوت التكيفي وشفافية الصوت."}'::jsonb, 
 'home-products', 11000, 1500, 12500, 0.3, 
 '["https://images.unsplash.com/photo-1588449668365-d15e397f6787?auto=format&fit=crop&q=80&w=400"]'::jsonb, 
 true, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 
 15, 'visible', '["Electronics"]'::jsonb, 5.0, 12, 'none', 0)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, cost_egp = EXCLUDED.cost_egp, profit_egp = EXCLUDED.profit_egp, price_egp = EXCLUDED.price_egp, weight = EXCLUDED.weight, images = EXCLUDED.images, featured = EXCLUDED.featured, sizes = EXCLUDED.sizes, colors = EXCLUDED.colors, variants = EXCLUDED.variants, stock = EXCLUDED.stock, status = EXCLUDED.status, tags = EXCLUDED.tags, rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value;
