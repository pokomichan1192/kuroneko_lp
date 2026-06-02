#!/bin/bash
# BOOTH + SUZURI の商品データを取得して data/goods.json を更新するスクリプト
# 使い方: bash scripts/update-goods.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(dirname "$SCRIPT_DIR")}"
OUTPUT="$PROJECT_DIR/data/goods.json"
IMG_DIR="$PROJECT_DIR/img/goods"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

mkdir -p "$IMG_DIR"

echo "=== GOODS データ更新 ==="
echo ""

echo "BOOTH を取得中..."
curl -s -L -A "$UA" "https://kuro-neko96ko-bo.booth.pm/" > /tmp/booth_goods.html

echo "SUZURI を取得中..."
curl -s -L -A "$UA" "https://suzuri.jp/kuroneko-project" > /tmp/suzuri_goods.html

echo "商品データを抽出中..."

# PythonでデータとURLリストを抽出、画像ダウンロードはcurlで行う
# BOOTH: 個別ページのJSON APIからpublished_atを取得
# SUZURI: 個別ページのHTMLからpublishedAtを取得
python3 << 'PYEOF' > /tmp/goods_result.json
import re, json, html as htmlmod

items = []
seen_ids = set()
downloads = []  # {"url": ..., "file": ...}
date_fetch = []  # {"store": ..., "url": ..., "index": ...} 日付取得用

# --- BOOTH ---
with open('/tmp/booth_goods.html', 'r') as f:
    booth = htmlmod.unescape(f.read())

booth_pattern = r'"product_id":(\d+),"product_name":"([^"]+)","product_price":(\d+)'
booth_matches = re.findall(booth_pattern, booth)
booth_thumbs = re.findall(r'"thumbnail_image_urls":\["(https://booth\.pximg\.net/c/300x300[^"]+)"', booth)
booth_urls = re.findall(r'"shop_item_url":"(https://kuro-neko96ko-bo\.booth\.pm/items/\d+)"', booth)

for i, m in enumerate(booth_matches):
    pid, name, price = m
    if pid in seen_ids: continue
    seen_ids.add(pid)
    img_url = booth_thumbs[i] if i < len(booth_thumbs) else ''
    local_img = f'booth_{pid}.jpg'
    if img_url:
        downloads.append({'url': img_url, 'file': local_img})
    idx = len(items)
    items.append({
        'name': name,
        'price': '¥' + f'{int(price):,}',
        'image': f'img/goods/{local_img}',
        'link': booth_urls[i] if i < len(booth_urls) else '',
        'store': 'BOOTH',
        'published_at': ''
    })
    # BOOTH JSON APIで日付取得
    date_fetch.append({'store': 'BOOTH', 'url': f'https://booth.pm/ja/items/{pid}.json', 'index': idx})

# --- SUZURI ---
with open('/tmp/suzuri_goods.html', 'r') as f:
    suzuri = htmlmod.unescape(f.read())

blocks = suzuri.split('"@type":"Product"')
suzuri_idx = 0
for block in blocks[1:]:
    snippet = block[:1200]
    name_m = re.search(r'"name":"([^"]+)"', snippet)
    price_m = re.search(r'"price":"?(\d+)', snippet)
    url_m = re.search(r'"url":"(https://suzuri\.jp/[^"]+)"', snippet)
    image_m = re.search(r'"image":"(https://lens\.suzuri\.jp/[^"]+)"', snippet)

    if name_m and image_m:
        suzuri_idx += 1
        img_url = image_m.group(1).replace('\\u0026', '&')
        local_img = f'suzuri_{suzuri_idx}.jpg'
        downloads.append({'url': img_url, 'file': local_img})
        idx = len(items)
        items.append({
            'name': name_m.group(1),
            'price': '¥' + f'{int(price_m.group(1)):,}' if price_m else '',
            'image': f'img/goods/{local_img}',
            'link': url_m.group(1) if url_m else '',
            'store': 'SUZURI',
            'published_at': ''
        })
        # SUZURI個別ページで日付取得
        if url_m:
            date_fetch.append({'store': 'SUZURI', 'url': url_m.group(1), 'index': idx})

print(json.dumps({'items': items, 'downloads': downloads, 'date_fetch': date_fetch}, ensure_ascii=False))
PYEOF

# JSONからダウンロードリストを取得してcurlで画像をダウンロード
echo ""
echo "画像をダウンロード中..."
python3 -c "
import json, sys
with open('/tmp/goods_result.json') as f:
    data = json.load(f)
for d in data['downloads']:
    print(d['url'] + '\t' + d['file'])
" | while IFS=$'\t' read -r url file; do
    filepath="$IMG_DIR/$file"
    code=$(curl -s -o "$filepath" -w "%{http_code}" -A "$UA" "$url")
    size=$(stat -f%z "$filepath" 2>/dev/null || echo 0)
    if [ "$code" = "200" ] && [ "$size" -gt 500 ]; then
        echo "  OK: $file (${size}B)"
    else
        echo "  NG: $file (HTTP $code, ${size}B)"
        rm -f "$filepath"
    fi
done

# 日付を取得してgoods_result.jsonを更新
echo ""
echo "公開日を取得中..."
python3 -c "
import json
with open('/tmp/goods_result.json') as f:
    data = json.load(f)
for d in data.get('date_fetch', []):
    print(d['store'] + '\t' + d['url'] + '\t' + str(d['index']))
" | while IFS=$'\t' read -r store url idx; do
    if [ "$store" = "BOOTH" ]; then
        # BOOTH: JSON APIからpublished_atを取得
        pub=$(curl -s -L -A "$UA" -H "Accept: application/json" "$url" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('published_at', ''))
except: print('')
" 2>/dev/null)
    else
        # SUZURI: 個別ページHTMLからpublishedAtを取得
        pub=$(curl -s -L -A "$UA" "$url" | python3 -c "
import sys, re, html as htmlmod
content = htmlmod.unescape(sys.stdin.read())
m = re.search(r'\"publishedAt\":\"([^\"]+)\"', content)
print(m.group(1) if m else '')
" 2>/dev/null)
    fi
    printf '%s\t%s\n' "$idx" "$pub"
done > /tmp/goods_dates.txt

# 日付をマージしてソート、goods.jsonを保存
python3 -c "
import json

with open('/tmp/goods_result.json') as f:
    data = json.load(f)

# 日付をアイテムにマージ
try:
    with open('/tmp/goods_dates.txt') as f:
        for line in f:
            line = line.strip()
            if '\t' not in line: continue
            idx_str, pub = line.split('\t', 1)
            idx = int(idx_str)
            if idx < len(data['items']):
                data['items'][idx]['published_at'] = pub
except FileNotFoundError:
    pass

# 公開日の新しい順にソート（日付なしは末尾）
data['items'].sort(key=lambda x: x.get('published_at', '') or '0000', reverse=True)

# published_atを除外して保存
output_items = []
for item in data['items']:
    out = {k: v for k, v in item.items() if k != 'published_at'}
    output_items.append(out)

with open('$OUTPUT', 'w') as f:
    json.dump(output_items, f, ensure_ascii=False, indent=2)

print()
print(f'=== 合計 {len(data[\"items\"])}件 保存完了（公開日の新しい順） ===')
for item in data['items']:
    pub = item.get('published_at', '')[:10] or '不明'
    print(f'  [{item[\"store\"]}] {item[\"name\"]} - {item[\"price\"]} ({pub})')
"

rm -f /tmp/booth_goods.html /tmp/suzuri_goods.html /tmp/goods_result.json
echo ""
echo "=== 更新完了: $OUTPUT ==="
