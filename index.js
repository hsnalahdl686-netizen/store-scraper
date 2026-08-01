const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

        const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
        const ogImage = $('meta[property="og:image"]').attr('content');

        if (ogTitle && ogImage) {
            items.push({
                title: ogTitle.substring(0, 60).trim(),
                image: ogImage
            });
        }

        $('img').each((i, el) => {
            const $img = $(el);
            const imgSrc = $img.attr('src') || $img.attr('data-src');
            const altText = $img.attr('alt');

            if (imgSrc && altText && altText.length > 3) {
                let fullImgUrl = imgSrc;
                if (imgSrc.startsWith('//')) {
                    fullImgUrl = 'https:' + imgSrc;
                } else if (imgSrc.startsWith('/')) {
                    const parsedUrl = new URL(targetUrl);
                    fullImgUrl = parsedUrl.origin + imgSrc;
                }

                if (!fullImgUrl.includes('logo') && !fullImgUrl.includes('icon') && !items.some(item => item.image === fullImgUrl)) {
                    items.push({
                        title: altText.substring(0, 60),
                        image: fullImgUrl
                    });
                }
            }
        });

        res.json({ items: items.slice(0, 15) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to scrape target site' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
