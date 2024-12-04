# Fonparam API

Fonparam, Türkiye'deki yatırım fonlarının verilerini sunan bir API servisidir.

## Özellikler

- Yatırım fonlarının güncel ve geçmiş verilerini sorgulama
- Portföy yönetim şirketleri hakkında detaylı bilgiler
- Fonların karşılaştırmalı analizi
- Performans istatistikleri ve getiri oranları

## Rate Limiting

API'nin tüm endpointleri için rate limiting uygulanmaktadır:

- Her endpoint için 15 dakikada maksimum 25 istek
- Her endpoint için günlük maksimum 100 istek
- Rate limit aşıldığında 429 (Too Many Requests) hatası döner
- Rate limit sayaçları IP bazlı tutulur

## Kurulum

1. Repoyu klonlayın:
```bash
git clone git@github.com:kemalersin/fonparam-backend.git
cd fonparam-backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Örnek env dosyasını kopyalayıp düzenleyin:
```bash
cp .env.example .env
```

4. Veritabanını oluşturun:
```sql
CREATE DATABASE fonparam CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
```

5. Uygulamayı başlatın:
```bash
# Geliştirme modu
npm run dev

# Prodüksiyon modu
npm run build
npm start
```

## API Dokümantasyonu

API dokümantasyonuna `http://localhost:3000/api-docs` adresinden erişebilirsiniz.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 