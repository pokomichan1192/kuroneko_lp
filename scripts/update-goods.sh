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
python3 << 'PYEOF' > /tmp/goods_result.json
import re, json, html as htmlmod

items = []
seen_ids = set()
downloads = []  # {"url": ..., "file": ...}

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
    items.append({
        'name': name,
        'price': '¥' + f'{int(price):,}',
        'image': f'img/goods/{local_img}',
        'link': booth_urls[i] if i < len(booth_urls) else '',
        'store': 'BOOTH'
    })

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
        items.append({
            'name': name_m.group(1),
            'price': '¥' + f'{int(price_m.group(1)):,}' if price_m else '',
            'image': f'img/goods/{local_img}',
            'link': url_m.group(1) if url_m else '',
            'store': 'SUZURI'
        })

print(json.dumps({'items': items, 'downloads': downloads}, ensure_ascii=False))
PYEOF

# JSONからダウンロードリストを取得してcurlで画像をダウンロード
echo ""
echo "画像をダウンロード中..."
python3 -c "
import json, sys
with open('/tmp/goods_result.json') as f:
    data = json.load(f)
for d in data['downloads']:
    print(d['url'] + '|||' + d['file'])
" | while IFS='|||' read -r url file; do
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

# goods.json を保存
python3 -c "
import json
with open('/tmp/goods_result.json') as f:
    data = json.load(f)
with open('$OUTPUT', 'w') as f:
    json.dump(data['items'], f, ensure_ascii=False, indent=2)
print()
print(f'=== 合計 {len(data[\"items\"])}件 保存完了 ===')
for item in data['items']:
    print(f'  [{item[\"store\"]}] {item[\"name\"]} - {item[\"price\"]}')
"

rm -f /tmp/booth_goods.html /tmp/suzuri_goods.html /tmp/goods_result.json
echo ""
echo "=== 更新完了: $OUTPUT ==="
