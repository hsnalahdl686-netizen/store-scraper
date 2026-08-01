app.get('/api/scrape', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

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

        // استهداف هيكلة منتجات منصة زد (Zid stores)
        // عادة ما تكون المنتجات داخل عناصر بطاقات أو عناصر قائمة تحتوي على صور وروابط وعناوين مخصصة
        // نبحث عن الحاويات التي تخدم تصميم زد الشهير للمنتجات
        $('.product-card, .product-item, div[class*="product"], li[class*="product"]').each((i, el) => {
            const $el = $(el);
            
            // استخراج صورة المنتج (البحث عن العناصر الشائعة للصور في زد)
            const imgSrc = $el.find('img').attr('data-src') || 
                           $el.find('img').attr('src') || 
                           $el.find('.product-image img').attr('src');
            
            // استخراج عنوان المنتج
            const title = $el.find('.product-title, .product-name, h3, h2, a[title]').first().text().trim() ||
                          $el.find('img').attr('alt');

            if (imgSrc && title && title.length > 2) {
                let fullImgUrl = imgSrc;
                if (imgSrc.startsWith('//')) {
                    fullImgUrl = 'https:' + imgSrc;
                } else if (imgSrc.startsWith('/')) {
                    const parsedUrl = new URL(targetUrl);
                    fullImgUrl = parsedUrl.origin + imgSrc;
                }

                // منع التكرار
                if (!items.some(item => item.title === title)) {
                    items.push({ image: fullImgUrl, title: title.substring(0, 60) });
                }
            }
        });

        // خطة بديلة إذا لم تضبط الكلاسات بدقة: البحث الشامل عن أي صور منتجات مرتبطة بعناوين داخل الصفحة
        if (items.length === 0) {
            $('img').each((i, el) => {
                const $img = $(el);
                const imgSrc = $img.attr('src') || $img.attr('data-src');
                const altText = $img.attr('alt');
                
                if (imgSrc && altText && altText.length > 5) {
                    let fullImgUrl = imgSrc;
                    if (imgSrc.startsWith('//')) {
                        fullImgUrl = 'https:' + imgSrc;
                    } else if (imgSrc.startsWith('/')) {
                        const parsedUrl = new URL(targetUrl);
                        fullImgUrl = parsedUrl.origin + imgSrc;
                    }

                    if (!items.some(item => item.title === altText)) {
                        items.push({ image: fullImgUrl, title: altText.substring(0, 60) });
                    }
                }
            });
        }

        res.json({ items: items.slice(0, 15) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to scrape target site' });
    }
});
