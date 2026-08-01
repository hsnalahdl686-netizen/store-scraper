// مسار السيرفر لجلب البيانات وسحب العناصر عبر Cheerio بشكل صحيح
app.get('/api/scrape', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تصحيح الرابط تلقائياً لو وُجد خطأ في بادئة الإدخال
    if (targetUrl.startsWith('/')) {
        targetUrl = targetUrl.substring(1);
    }

    try {
        const { data } = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        const $ = cheerio.load(data);
        const items = [];

        // البحث عن بطاقات المنتجات بناءً على الهيكلة الشائعة في المتاجر الإلكترونية
        // نقوم بالبحث عن العناصر التي تحتوي على صور داخل حاويات منتجات
        $('div, article, li').each((i, el) => {
            const $el = $(el);
            // محاولة إيجاد الصورة والعنوان داخل نفس الحاوية لضمان دقة البيانات
            const imgSrc = $el.find('img').attr('src') || $el.find('img').attr('data-src');
            const title = $el.find('h3, h2, .title, a').first().text().trim();

            if (imgSrc && title && title.length > 3) {
                // التأكد من أن رابط الصورة كامل
                let fullImgUrl = imgSrc;
                if (imgSrc.startsWith('//')) {
                    fullImgUrl = 'https:' + imgSrc;
                } else if (imgSrc.startsWith('/')) {
                    const parsedUrl = new URL(targetUrl);
                    fullImgUrl = parsedUrl.origin + imgSrc;
                }

                // منع تكرار المنتجات في المصفوفة
                if (!items.some(item => item.title === title)) {
                    items.push({ image: fullImgUrl, title: title.substring(0, 60) });
                }
            }
        });

        res.json({ items: items.slice(0, 12) }); // إرجاع أول 12 منتجاً تم العثور عليها
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'فشل في سحب الموقع المستهدف' });
    }
});
