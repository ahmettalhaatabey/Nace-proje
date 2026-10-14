"""Kaynak keşfi: resmi NACE / tehlike sınıfı dosyalarını indirir ve data/raw altına kaydeder."""
import os, re, sys, urllib.parse, requests

OUT = "data/raw"
os.makedirs(OUT, exist_ok=True)
S = requests.Session()
S.headers["User-Agent"] = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"

def get(url, name=None):
    try:
        r = S.get(url, timeout=60, allow_redirects=True)
        print(f"[{r.status_code}] {len(r.content):>9} {r.headers.get('content-type','')} {url}")
        if r.ok and name:
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(r.content)
        return r
    except Exception as e:
        print(f"[ERR] {url} {e}")
        return None

pages = {
    "mevzuat_page.html": "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16909&MevzuatTur=9&MevzuatTertip=5",
    "mevzuat_iframe.html": "https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=9&MevzuatNo=16909&MevzuatTertip=5",
    "rg_20250313.html": "https://www.resmigazete.gov.tr/eskiler/2025/03/20250313.htm",
    "rg_20250521.html": "https://www.resmigazete.gov.tr/eskiler/2025/05/20250521.htm",
    "rg_20260401.html": "https://www.resmigazete.gov.tr/eskiler/2026/04/20260401.htm",
}
for name, url in pages.items():
    r = get(url, name)
    if not r or not r.ok:
        continue
    html = r.text
    for href in sorted(set(re.findall(r'(?:href|src)=["\']([^"\']+)["\']', html))):
        low = href.lower()
        if any(k in low for k in (".xls", ".pdf", "ek", "16909", "mevzuatmetin", "-1.", "-2.", "-3.", "-4.", "-5.", "-6.", "-7.", "-8.", "-9.")):
            full = urllib.parse.urljoin(url, href)
            print("   link:", full)

direct = [
    "https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/9.5.16909-Ek.xlsx",
    "https://www.mevzuat.gov.tr/MevzuatMetin/teblig/9.5.16909-Ek.xlsx",
    "https://www.mevzuat.gov.tr/anasayfa/9.5.16909-Ek.xlsx",
    "https://www.mevzuat.gov.tr/mevzuatmetin/yonetmelik/9.5.16909-ek.xlsx",
    "https://www.mevzuat.gov.tr/MevzuatMetin/9.5.16909.pdf",
    "https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=16909&mevzuatTur=Teblig&mevzuatTertip=5",
    "https://www.mevzuat.gov.tr/MevzuatMetin/ekler/9.5.16909-Ek.xlsx",
    "https://www.mevzuat.gov.tr/MevzuatMetin/9.5.16909-Ek.xlsx",
    "https://www.mevzuat.gov.tr/mevzuatmetin/teblig/9.5.16909-Ek.xlsx",
    "https://www.mevzuat.gov.tr/MevzuatMetin/Ek/9.5.16909-Ek.xlsx",
    "https://isgb.iyte.edu.tr/wp-content/uploads/sites/10026/2026/02/%C4%B0SG-%C4%B0%C5%9Fyeri-tehlike-S%C4%B1n%C4%B1flar%C4%B1-Tebli%C4%9Fi_NACE.pdf",
    "https://isg.gop.edu.tr/depo/menuler/birim_11394/mevzuat_49/dosya_icerik/9348427/mevzuat_20250826110523.pdf",
    "https://www.alomaliye.com/wp-content/uploads/2025/03/turmob-issagligi.pdf",
    "https://www.turmob.org.tr/arsiv/mbs/resmigazete/-Guncel2020_NaceListesi.pdf",
]
for i, url in enumerate(direct[:4]):
    r = get(url, f"ek_{i:02d}.xlsx")
    if r is not None and r.ok and r.content[:2] == b"PK":
        print("   >>> XLSX BULUNDU:", url)
direct = direct[4:]
for i, url in enumerate([]):
    ext = ".xlsx" if "xlsx" in url else ".pdf"
    get(url, f"direct_{i:02d}{ext}")
