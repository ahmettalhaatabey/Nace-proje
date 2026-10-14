#!/usr/bin/env python3
"""
ÇSGB "İş Sağlığı ve Güvenliğine İlişkin İşyeri Tehlike Sınıfları Tebliği" Ek-1 listesini
mevzuat.gov.tr'den indirir, ayrıştırır ve uygulamanın kullandığı veri dosyalarını üretir.

Çıktılar:
  data/nace.json                  – makinece okunabilir tam liste
  data/nace.js                    – uygulamanın yüklediği aynı veri (window.NACE_DATA)
  data/kaynak/ek1_resmi.xlsx      – indirilen resmi Excel dosyasının kopyası

Kullanım:
  python scripts/update_data.py                 # resmi kaynaktan indir
  python scripts/update_data.py --xlsx dosya.xlsx [--html sayfa.html]   # yerel dosyadan
"""
import argparse
import datetime as dt
import io
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
JSON_PATH = os.path.join(DATA_DIR, "nace.json")
JS_PATH = os.path.join(DATA_DIR, "nace.js")
XLSX_COPY = os.path.join(DATA_DIR, "kaynak", "ek1_resmi.xlsx")

MEVZUAT_NO = "16909"
PAGE_URL = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16909&MevzuatTur=9&MevzuatTertip=5"
IFRAME_URL = "https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=9&MevzuatNo=16909&MevzuatTertip=5"
XLSX_URLS = [
    "https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/9.5.16909-Ek.xlsx",
    "https://www.mevzuat.gov.tr/MevzuatMetin/teblig/9.5.16909-Ek.xlsx",
]
SOURCE_NAME = "ÇSGB – İş Sağlığı ve Güvenliğine İlişkin İşyeri Tehlike Sınıfları Tebliği, Ek-1"
HISTORY_LIMIT = 30
MIN_ITEMS = 1500

CODE_RE = re.compile(r'^[\s"\'“”]*([A-Z]|\d{2}(?:\.\d{1,2}(?:\.\d{2})?)?)(?=\s|\(|$)\s*(.*)$', re.S)
NOTE_RE = re.compile(r"\(([^()]*RG[^()]*)\)")


def clean(s):
    if s is None:
        return ""
    s = str(s).replace("\xa0", " ").replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def fold(s):
    s = s.replace("ı", "i").replace("İ", "i").replace("I", "i")
    s = unicodedata.normalize("NFKD", s.lower())
    return "".join(c for c in s if not unicodedata.combining(c))


def parse_hazard(raw):
    """'Çok Tehlikeli *', ' az Tehlikeli', 'Tehlikeli ' → (3|1|2, dipnot)"""
    s = clean(raw)
    if not s:
        return None, False
    star = "*" in s
    f = fold(s.replace("*", "")).strip()
    if f.startswith("cok"):
        return 3, star
    if f.startswith("az"):
        return 1, star
    if f.startswith("tehlikeli"):
        return 2, star
    return None, star


def tidy_note(note):
    note = clean(note)
    note = re.sub(r"\s*:\s*", ": ", note)
    # Kaynaktaki yazım hatası: "RG-1/42026-33211" → "RG-1/4/2026-33211"
    note = re.sub(r"RG-(\d{1,2})/(\d{1,2})(\d{4})-", r"RG-\1/\2/\3-", note)
    return note


# --------------------------------------------------------------------------- indirme
def http_get(url):
    import requests

    headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"}
    last = None
    for attempt in range(4):
        try:
            r = requests.get(url, headers=headers, timeout=90)
            r.raise_for_status()
            return r
        except Exception as e:  # ağ hatalarında tekrar dene
            last = e
            import time

            time.sleep(2 ** attempt)
    raise RuntimeError(f"{url} indirilemedi: {last}")


def download():
    html = ""
    try:
        html = http_get(IFRAME_URL).text
    except Exception as e:
        print("Uyarı: tebliğ metni alınamadı:", e, file=sys.stderr)

    urls = list(XLSX_URLS)
    # Sayfadaki Ek bağlantısı değişirse onu da dene
    for href in re.findall(r'href="([^"]*Ek[^"]*\.xlsx?)"', html, re.I):
        if href.startswith("http"):
            urls.insert(0, href)
        else:
            urls.insert(0, "https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/" + href.lstrip("/"))

    for url in dict.fromkeys(urls):
        try:
            r = http_get(url)
        except Exception as e:
            print("Uyarı:", e, file=sys.stderr)
            continue
        if r.content[:2] == b"PK":
            print("Ek-1 indirildi:", url, len(r.content), "bayt")
            return r.content, url, html
        print("Uyarı: Excel değil:", url, r.headers.get("content-type"), file=sys.stderr)
    raise RuntimeError("Ek-1 Excel dosyası hiçbir adresten indirilemedi")


# --------------------------------------------------------------------------- ayrıştırma
def parse_amendments(html):
    """Tebliğ sayfasındaki değişiklik listesinden (sıra, tarih, sayı) çıkarır."""
    if not html:
        return []
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&nbsp;|\s+", " ", text)
    idx = text.find("Değişiklik Yapan")
    if idx < 0:
        return []
    out = []
    for m in re.finditer(r"(\d{1,2})\.\s*(\d{1,2}/\d{1,2}/\d{4})\s+(\d{5})(\s*\(Mükerrer\))?", text[idx:]):
        out.append({"no": int(m.group(1)), "date": m.group(2), "number": m.group(3) + (" (Mükerrer)" if m.group(4) else "")})
    return out


def parse_xlsx(content):
    import openpyxl

    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws = wb.worksheets[0]

    title = ""
    sections, nodes, items, repealed, footnotes = [], {}, [], [], []
    current = None
    problems = []

    for row in ws.iter_rows(values_only=True):
        cells = list(row) + [None] * 3
        c_raw, t_raw, h_raw = cells[0], cells[1], cells[2]
        c = clean(c_raw)
        t = clean(t_raw)
        if not c and not t:
            continue
        if not c and "Ek-1" in t:
            title = t
            continue
        if c.startswith("*"):
            footnotes.append(c.lstrip("* ").strip())
            continue
        m = CODE_RE.match(c)
        if not m:
            if "Altılı" not in c and "Altılı" not in t:
                problems.append(f"Tanınmayan satır: {c!r} | {t!r}")
            continue
        code, rest = m.group(1), m.group(2)
        nm = NOTE_RE.search(rest) or NOTE_RE.search(t)
        note = tidy_note(nm.group(1)) if nm else ""
        if nm and NOTE_RE.search(t):
            t = clean(NOTE_RE.sub("", t))

        if "mülga" in note.lower():
            repealed.append([code, note])
            continue

        if re.fullmatch(r"[A-Z]", code):
            current = {"k": code, "t": t, "divisions": []}
            sections.append(current)
            continue
        if len(code) < 8:  # 01 / 01.1 / 01.11 başlıkları
            nodes[code] = t
            if len(code) == 2 and current is not None:
                current["divisions"].append(code)
            continue

        hz, star = parse_hazard(h_raw)
        if hz is None:
            problems.append(f"Tehlike sınıfı okunamadı: {code} {h_raw!r}")
            continue
        if not t:
            problems.append(f"Tanımı boş: {code}")
            continue
        # [kod, tanım, tehlike(1-3), bölüm, değişiklik notu?, dipnot(asbest)?]
        item = [code, t, hz, current["k"] if current else ""]
        if note or star:
            item.append(note)
        if star:
            item.append(1)
        items.append(item)

    return {
        "title": title,
        "sections": sections,
        "nodes": nodes,
        "items": items,
        "repealed": repealed,
        "footnotes": footnotes,
        "problems": problems,
    }


def validate(parsed):
    items = parsed["items"]
    errs = []
    if len(items) < MIN_ITEMS:
        errs.append(f"Çok az kayıt: {len(items)}")
    codes = [i[0] for i in items]
    dup = sorted({c for c in codes if codes.count(c) > 1})
    if dup:
        errs.append(f"Tekrarlanan kodlar: {dup[:20]}")
    counts = {h: sum(1 for i in items if i[2] == h) for h in (1, 2, 3)}
    if min(counts.values()) < 50:
        errs.append(f"Tehlike sınıfı dağılımı şüpheli: {counts}")
    if len(parsed["sections"]) < 15:
        errs.append(f"Bölüm sayısı şüpheli: {len(parsed['sections'])}")
    return errs, counts


# --------------------------------------------------------------------------- karşılaştırma
def diff(old_items, new_items):
    o = {i[0]: i for i in old_items}
    n = {i[0]: i for i in new_items}
    added = [[k, n[k][1], n[k][2]] for k in sorted(n.keys() - o.keys())]
    removed = [[k, o[k][1], o[k][2]] for k in sorted(o.keys() - n.keys())]
    hz_changed, text_changed = [], []
    for k in sorted(n.keys() & o.keys()):
        if o[k][2] != n[k][2]:
            hz_changed.append([k, n[k][1], o[k][2], n[k][2]])
        if o[k][1] != n[k][1]:
            text_changed.append([k, o[k][1], n[k][1]])
    return {"added": added, "removed": removed, "hazardChanged": hz_changed, "textChanged": text_changed}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", help="Yerel Ek-1 Excel dosyası")
    ap.add_argument("--html", help="Yerel tebliğ metni (değişiklik listesi için)")
    ap.add_argument("--source-url", default=XLSX_URLS[0])
    args = ap.parse_args()

    if args.xlsx:
        content = open(args.xlsx, "rb").read()
        html = open(args.html, encoding="utf-8").read() if args.html else ""
        src_url = args.source_url
    else:
        content, src_url, html = download()

    parsed = parse_xlsx(content)
    for p in parsed["problems"]:
        print("Uyarı:", p, file=sys.stderr)
    errs, counts = validate(parsed)
    if errs:
        for e in errs:
            print("HATA:", e, file=sys.stderr)
        print("Doğrulama başarısız; mevcut veri korunuyor.", file=sys.stderr)
        sys.exit(1)

    amendments = parse_amendments(html)
    previous = None
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, encoding="utf-8") as f:
            previous = json.load(f)

    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    last_am = amendments[-1] if amendments else None
    if not last_am and previous:
        last_am = previous["meta"].get("lastAmendmentRaw")

    history = (previous or {}).get("history", [])
    updated_at = (previous or {}).get("meta", {}).get("updatedAt") or now
    changed = (
        previous is None
        or previous.get("items") != parsed["items"]
        or previous.get("nodes") != parsed["nodes"]
        or previous.get("sections") != parsed["sections"]
        or previous["meta"].get("repealed") != parsed["repealed"]
        or (bool(last_am) and previous["meta"].get("lastAmendmentRaw") != last_am)
    )
    if previous is not None and changed:
        d = diff(previous["items"], parsed["items"])
        if any(d.values()):
            entry = {"date": now}
            if last_am:
                entry["lastAmendment"] = f"RG {last_am['date']} – {last_am['number']}"
            entry.update({k: v for k, v in d.items() if v})
            history = [entry] + history
            history = history[:HISTORY_LIMIT]
        updated_at = now
    elif previous is None:
        updated_at = now

    meta = {
        "source": SOURCE_NAME,
        "sourceUrl": PAGE_URL,
        "fileUrl": src_url,
        "sheetTitle": parsed["title"],
        "revision": "NACE Rev.2.1 (Ver.3) altılı kodlar",
        "lastAmendment": f"{last_am['date']} tarihli ve {last_am['number']} sayılı Resmî Gazete" if last_am else "",
        "lastAmendmentRaw": last_am,
        "amendments": amendments,
        "updatedAt": updated_at,
        "count": len(parsed["items"]),
        "hazardCounts": {"1": counts[1], "2": counts[2], "3": counts[3]},
        "footnotes": parsed["footnotes"],
        "repealed": parsed["repealed"],
    }
    out = {
        "meta": meta,
        "sections": parsed["sections"],
        "nodes": parsed["nodes"],
        "items": parsed["items"],
        "history": history,
    }

    os.makedirs(os.path.dirname(XLSX_COPY), exist_ok=True)
    with open(XLSX_COPY, "wb") as f:
        f.write(content)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(JS_PATH, "w", encoding="utf-8") as f:
        f.write("/* Otomatik üretilir: scripts/update_data.py – elle düzenlemeyin. */\n")
        f.write("window.NACE_DATA = ")
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    print(f"{len(parsed['items'])} kod yazıldı (Az: {counts[1]}, Tehlikeli: {counts[2]}, Çok: {counts[3]}); "
          f"{len(parsed['sections'])} bölüm, {len(parsed['nodes'])} başlık, {len(parsed['repealed'])} mülga satır.")
    print("Değişiklik:", "VAR" if changed else "yok", "| Son RG değişikliği:", meta["lastAmendment"] or "-")
    gh_out = os.environ.get("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")


if __name__ == "__main__":
    main()
