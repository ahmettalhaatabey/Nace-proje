# NACE Kodu & Tehlike Sınıfı Sorgulama

Mali müşavirlerin işletme açılışında doğru NACE faaliyet kodunu hızlıca bulması için hazırlanmış bir web uygulaması.
Müşteri işletmesini anlattığında (ör. *kuaför*, *kafe*, *oto tamir*, *e-ticaret*) arama kutusuna yazmanız yeterli:
ilgili altılı NACE kodları, faaliyet tanımları ve ÇSGB'nin belirlediği **tehlike sınıfları** listelenir.

## Özellikler

- **Akıllı arama**: Türkçe karakter şart değil (`kuafor` = `kuaför`), birden fazla kelime (`oto tamir`), halk ağzı karşılıklar
  (`emlakçı` → gayrimenkul, `kafe` → kahvehane/içecek sunumu, `influencer` → video içerik), kod ile arama (`47.11`, `4711`).
- **Filtreler**: tehlike sınıfı (Az Tehlikeli / Tehlikeli / Çok Tehlikeli), bölüm (A–Y), ana faaliyet grubu (2'li kod), sıralama.
- **Detay penceresi**: kodun bölüm → grup → sınıf hiyerarşisi, tehlike sınıfına göre özet İSG yükümlülükleri,
  aynı sınıftaki diğer kodlar, resmî değişiklik notu (ör. *Değişik satır: RG-1/4/2026-33211*).
- **Müşteri dosyası**: ☆ ile kodları müşteri adına toplayın; tek tıkla Excel veya PDF alın.
  Birden fazla faaliyette esas alınacak en yüksek tehlike sınıfı otomatik gösterilir.
- **Dışa aktarma**: filtrelenmiş liste veya müşteri dosyası için **Excel (.xlsx)**, **PDF** (Türkçe karakter destekli) ve **CSV**.
- **Son değişiklikler**: Resmî Gazete'ye göre eklenen, değişen ve mülga olan satırlar; otomatik güncellemelerde tespit edilen farklar.
- Paylaşılabilir arama bağlantıları (`?q=kuafor&t=2`), açık/koyu tema, mobil uyumlu, sunucu gerektirmez.

## Veri kaynağı ve güncellik

| | |
|---|---|
| Kaynak | Çalışma ve Sosyal Güvenlik Bakanlığı — *İş Sağlığı ve Güvenliğine İlişkin İşyeri Tehlike Sınıfları Tebliği*, Ek-1 |
| Resmî dosya | <https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/9.5.16909-Ek.xlsx> |
| Tebliğ sayfası | <https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16909&MevzuatTur=9&MevzuatTertip=5> |
| Sınıflama | NACE Rev.2.1 (Ver.3) altılı kodlar |
| Mevcut veri | 2.142 kod — 898 Az Tehlikeli, 888 Tehlikeli, 356 Çok Tehlikeli; son değişiklik 1/4/2026 tarihli ve 33211 sayılı RG |

**Veriler güncel kalır:** `.github/workflows/update-data.yml` her gün resmî Excel dosyasını mevzuat.gov.tr'den indirir,
`scripts/update_data.py` ile ayrıştırır ve doğrular (kayıt sayısı, tekrarlanan kod, sınıf dağılımı). Liste değiştiyse
`data/` klasörünü günceller, farkları (eklenen / kaldırılan / sınıfı veya tanımı değişen kodlar) değişiklik geçmişine yazar
ve siteyi yeniden yayınlar. Doğrulama başarısız olursa mevcut veri korunur. İsterseniz **Actions → Tehlike sınıfları
listesini güncelle → Run workflow** ile elle de çalıştırabilirsiniz.

## Kullanım

### İnternet üzerinden (GitHub Pages)

Bir kereye mahsus: depo **Settings → Pages → Build and deployment → Source: GitHub Actions** seçin. Sonrasında her
güncellemede site otomatik yayınlanır; adres `https://<kullanıcı-adı>.github.io/<depo-adı>/` olur.

### Kendi bilgisayarınızda

Depoyu ZIP olarak indirip açın ve `index.html` dosyasına çift tıklayın. İnternet bağlantısı gerekmez; tüm kütüphaneler
`vendor/` klasöründedir.

### Veriyi elle güncellemek

```bash
pip install requests openpyxl
python scripts/update_data.py                    # resmî kaynaktan indir
python scripts/update_data.py --xlsx Ek-1.xlsx   # elinizdeki Excel dosyasından
```

## Dosya yapısı

```
index.html                 Uygulama
assets/app.js, style.css   Arama, filtre, dışa aktarma mantığı ve görünüm
data/nace.js, nace.json    Üretilen veri (elle düzenlemeyin)
data/kaynak/ek1_resmi.xlsx İndirilen resmî Ek-1 dosyası
scripts/update_data.py     İndirme + ayrıştırma + doğrulama + değişiklik kaydı
vendor/                    SheetJS (Excel), jsPDF + AutoTable (PDF), DejaVu Sans (PDF'te Türkçe karakterler)
```

## Önemli not

Tehlike sınıfının tespitinde işyerinde yürütülen **asıl iş** esas alınır; birden fazla asıl iş varsa tehlike sınıfı yüksek
olan dikkate alınır (Tebliğ md. 2). Uygulamadaki İSG yükümlülük özetleri bilgilendirme amaçlıdır; resmî işlemlerde
mevzuat.gov.tr, SGK ve İSG-KATİP kayıtlarını esas alınız.
