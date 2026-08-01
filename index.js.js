const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// واجهة المستخدم بتصميم عصري وجذاب
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>منصة استنساخ وتصميم المتاجر</title>
            <style>
                body { font-family: Tahoma, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; text-align: center; }
                .container { max-width: 800px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                input[type="text"] { width: 70%; padding: 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 6px; outline: none; }
                button { padding: 12px 25px; font-size: 16px; background-color: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; }
                button:hover { background-color: #218838; }
                .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px; text-align: right; }
                .product-card { background: #fff; border: 1px solid #e1e1e1; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                .product-card img { max-width: 100%; height: 150px; object-fit: cover; border-radius: 6px; }
                .product-title { font-size: 14px; font-weight: bold; margin: 10px 0; color: #444; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>منصة بناء المتاجر الذكية</h1>
                <p>أدخل رابط أي صفحة منتجات أو متجر لجلب المحتوى وتصميم واجهة جديدة:</p>
                <input type="text" id="targetUrl" placeholder="https://example.com/products">
                <button onclick="scrapeStore()">استعراض وتصميم</button>
                
                <div id="results" class="products-grid"></div>
            </div>

            <script>
                async function scrapeStore() {
                    const url = document.getElementById('targetUrl').value;
                    const resultsDiv = document.getElementById('results');
                    if (!url) { alert('الرجاء إدخال الرابط أولاً'); return; }
                    
                    resultsDiv.innerHTML = '<p>جاري جلب البيانات وتصميم المتجر...</p>';
                    try {
                        const response = await fetch('/api/scrape?url=' + encodeURIComponent(url));
                        const data = await response.json();
                        
                        if(data.items && data.items.length > 0) {
                            resultsDiv.innerHTML = data.items.map(item => \`
                                <div class="product-card">
                                    <img src="\${item.image || 'https://via.placeholder.com/150'}" alt="صورة المنتج">
                                    <div class="product-title">\${item.title || 'منتج بدون اسم'}</div>
                                </div>
                            \`).join('');
                        } else {
                            resultsDiv.innerHTML = '<p>لم يتم العثور على منتجات، تأكد من صحة الرابط.</p>';
                        }
                    } catch (error) {
                        resultsDiv.innerHTML = '<p style="color:red;">حدث خطأ أثناء جلب البيانات.</p>';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// مسار السيرفر لجلب البيانات وسحب العناصر عبر Cheerio
app.get('/api/scrape', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        const { data } = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(data);
        const items = [];

        // محاولة استخراج الصور والعناوين بناءً على الهيكلة العامة للمتاجر
        $('img').forEach((i, el) => {
            const imgSrc = $(el).attr('src');
            const altText = $(el).attr('alt') || $(el).parent().text().trim();
            if (imgSrc && imgSrc.startsWith('http')) {
                items.push({ image: imgSrc, title: altText.substring(0, 50) });
            }
        });

        res.json({ items: items.slice(0, 12) }); // إرجاع أول 12 عنصر كمثال
    } catch (err) {
        res.status(500).json({ error: 'فشل في سحب الموقع المستهدف' });
    }
});

app.listen(PORT, () => {
    console.log('السيرفر يعمل بنجاح على البورت: ' + PORT);
});