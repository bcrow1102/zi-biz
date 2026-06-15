const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getBaseUrl(req) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return `${proto}://${host}`;
}

export default async function handler(req, res) {
    try {
        const slug = String(req.query.slug || '').trim();

        if (!slug) {
            res.status(400).send('Missing slug');
            return;
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            res.status(500).send('Missing Supabase environment variables');
            return;
        }

        const endpoint =
            `${SUPABASE_URL}/rest/v1/namecards` +
            `?slug=eq.${encodeURIComponent(slug)}` +
            `&select=slug,name,position,company,summary,desc1,desc2,website,og_image_url` +
            `&limit=1`;

        const sbRes = await fetch(endpoint, {
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                Accept: 'application/json'
            }
        });

        if (!sbRes.ok) {
            const text = await sbRes.text();
            res.status(500).send(`Supabase error: ${text}`);
            return;
        }

        const rows = await sbRes.json();
        const card = rows && rows[0];

        if (!card) {
            res.status(404).send('Namecard not found');
            return;
        }

        const baseUrl = getBaseUrl(req);
        const viewUrl = `${baseUrl}/share/namecard.html?slug=${encodeURIComponent(slug)}`;
        const ogUrl = `${baseUrl}/n/${encodeURIComponent(slug)}`;

        const name = card.name || '지모비즈 디지털 명함';
        const position = card.position || '';
        const company = card.company || '';
        const summary = card.summary || '디지털 명함을 확인해 주세요.';
        const desc1 = card.desc1 || '';
        const desc2 = card.desc2 || '';

        const titleParts = [name, position, company].filter(Boolean);
        const ogTitle = titleParts.length ? titleParts.join(' / ') : '지모비즈 디지털 명함';

        const ogDescription = [summary, desc1, desc2]
            .filter(Boolean)
            .join(' ')
            .slice(0, 180) || '지모비즈 디지털 명함입니다.';

        const ogImage = card.og_image_url || `${baseUrl}/assets/img/event-gold-card.webp`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

        res.status(200).send(`<!doctype html>
<html lang="ko">
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(ogTitle)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(ogUrl)}" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

    <link rel="canonical" href="${escapeHtml(ogUrl)}" />

    <meta http-equiv="refresh" content="0; url=${escapeHtml(viewUrl)}" />
    <script>
        window.location.replace(${JSON.stringify(viewUrl)});
    </script>
</head>
<body>
    <p>디지털 명함으로 이동 중입니다.</p>
    <p><a href="${escapeHtml(viewUrl)}">바로가기</a></p>
</body>
</html>`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}