# 🔌 FonParam HTTP MCP (Model Context Protocol) Integration

## 🎯 Overview

FonParam API'si artık **HTTP tabanlı MCP (Model Context Protocol)** desteği ile AI asistanlarınızın doğrudan Türk yatırım fonları analizi yapmasına olanak sağlıyor! Claude, ChatGPT ve diğer AI asistanları ile konuşmalı finans danışmanlığı deneyimi yaşayın.

## 🚀 Quick Start

### 1. HTTP MCP Server'ı Başlatın

```bash
# Development ortamında
npm run mcp-server

# Production build ile
npm run mcp-build

# Özel port ile
npm run mcp-build 3002
```

Server başladığında şu adreslerde hizmet verir:
- **Server Info**: http://localhost:3001/mcp/info
- **Tools List**: http://localhost:3001/mcp/tools  
- **Health Check**: http://localhost:3001/mcp/health

### 2. Claude Desktop ile HTTP MCP Kullanımı

**Seçenek A: Claude Desktop HTTP Client (Önerilen)**

`claude_desktop_config.json` dosyanıza ekleyin:

```json
{
  "mcpServers": {
    "fonparam": {
      "command": "node",
      "args": ["-e", "require('http').get('http://localhost:3001/mcp/tools', res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => console.log(data)); })"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3001"
      }
    }
  }
}
```

**Seçenek B: Production Server (API adresiniz için)**

```json
{
  "mcpServers": {
    "fonparam": {
      "command": "curl",
      "args": ["-s", "https://api.fonapram.com:3001/mcp/tools"],
      "env": {
        "MCP_SERVER_URL": "https://api.fonapram.com:3001"
      }
    }
  }
}
```

### 3. Sunucunuzda MCP Server Çalıştırma

```bash
# Ana API (port 3000 veya 80/443)
npm start

# MCP Server (port 3001)
npm run mcp-build
```

**Environment (.env.prod):**
```bash
ENABLE_MCP_SERVER=true
MCP_PORT=3001
```

### 4. AI ile HTTP MCP Kullanımı

HTTP endpoint'leri direkt kullanabilirsiniz:

```bash
# Tools listesi
curl http://localhost:3001/mcp/tools

# Fund analizi
curl -X POST http://localhost:3001/mcp/tools/analyze_fund_investment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "arguments": {
      "fundCode": "AAK",
      "initialInvestment": 10000,
      "monthlyInvestment": 1000,
      "startDate": "last_3_years"
    },
    "id": "1"
  }'
```

## 🛠️ Available HTTP MCP Tools

### 1. **GET /mcp/tools** - Available Tools List
```bash
curl http://localhost:3001/mcp/tools
```

### 2. **POST /mcp/tools/analyze_fund_investment** - Kapsamlı Yatırım Analizi
```json
{
  "arguments": {
    "fundCode": "AAK",
    "initialInvestment": 5000,
    "monthlyInvestment": 500,
    "startDate": "last_1_year",
    "yearlyIncrease": { "type": "percentage", "value": 10 },
    "includeMonthlyDetails": true
  },
  "id": "1"
}
```

### 3. **POST /mcp/tools/compare_funds** - Fon Karşılaştırması
```json
{
  "arguments": {
    "fundCodes": ["AAK", "DAH", "PKF"],
    "metrics": ["return", "risk", "sharpe"],
    "period": "long_term"
  },
  "id": "2"
}
```

### 4. **POST /mcp/tools/get_market_insights** - Piyasa Analizi
```json
{
  "arguments": {
    "fundType": "hisse_senedi",
    "timeframe": "monthly",
    "limit": 10
  },
  "id": "3"
}
```

## 🌐 HTTP MCP Server Endpoints

### Server Info
```bash
GET http://localhost:3001/mcp/info
```

### Health Check
```bash
GET http://localhost:3001/mcp/health
```

### Tools List
```bash
GET http://localhost:3001/mcp/tools
```

### Execute Tool
```bash
POST http://localhost:3001/mcp/tools/{toolName}
Content-Type: application/json
X-API-Key: your_api_key (optional)

{
  "arguments": { /* tool parameters */ },
  "id": "request_id"
}
```

## 🔐 Authentication & Rate Limiting

### Anonymous Access (Sınırlı)
- Günlük: 25 istek
- Aylık: 100 istek
- Tüm temel analizler kullanılabilir

### API Key Access (Gelişmiş)
- Günlük: 100+ istek
- Aylık: 3000+ istek
- Gelişmiş özellikler ve detaylı analizler

### HTTP Header ile API Key:
```bash
curl -H "X-API-Key: your_api_key_here" \
     -X POST http://localhost:3001/mcp/tools/analyze_fund_investment
```

### Request Body'de API Key:
```json
{
  "arguments": {
    "apiKey": "your_api_key_here",
    "fundCode": "AAK"
  }
}
```

## 📋 Environment Configuration

### `.env.dev` / `.env.prod` dosyanıza ekleyin:

```bash
# HTTP MCP Server Enable/Disable
ENABLE_MCP_SERVER=true
MCP_PORT=3001

# Database Settings (existing)
DB_NAME=fonparam
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost

# Redis Settings (existing)  
REDIS_URL=redis://localhost:6379

# API Settings (existing)
API_URL=http://localhost:3000
```

## 🎮 Interactive Examples

### Scenario 1: Retirement Planning
```bash
curl -X POST http://localhost:3001/mcp/tools/analyze_fund_investment \
  -H "Content-Type: application/json" \
  -d '{
    "arguments": {
      "fundCode": "AAK",
      "initialInvestment": 50000,
      "monthlyInvestment": 2000,
      "startDate": "last_3_years",
      "yearlyIncrease": {"type": "percentage", "value": 8}
    }
  }'
```

### Scenario 2: Market Overview
```bash
curl -X POST http://localhost:3001/mcp/tools/get_market_insights \
  -H "Content-Type: application/json" \
  -d '{
    "arguments": {
      "timeframe": "monthly",
      "limit": 5
    }
  }'
```

## 🔧 Development & Production

### Development Mode
```bash
npm run mcp-server
```

### Production Mode
```bash
npm run mcp-build
```

### Ana API ile Beraber Çalıştırma (.env.prod)
```bash
ENABLE_MCP_SERVER=true
MCP_PORT=3001
```

Bu durumda:
- **Ana API**: Port 3000 (veya 80/443)
- **MCP Server**: Port 3001

## 🚨 Important Notes

1. **HTTP Transport**: Artık stdio değil, HTTP kullanıyoruz
2. **Rate Limiting**: Anonymous kullanım sınırlı, API key öneriliyor
3. **CORS**: Claude.ai ve localhost'tan erişim izni var
4. **Real-time Data**: Veriler günlük güncelleniyor
5. **Production**: MCP Server'ı sunucunuzda port 3001'de çalıştırın

## 🌍 Production Deployment

### Sunucunuzda (https://api.fonapram.com):

```bash
# Ana API başlat
npm start

# MCP Server başlat (ayrı terminal)
MCP_PORT=3001 npm run mcp-build
```

Claude Desktop konfigürasyonu:
```json
{
  "mcpServers": {
    "fonparam": {
      "command": "curl",
      "args": ["-s", "https://api.fonapram.com:3001/mcp/info"]
    }
  }
}
```

## 📞 Support & Contact

- **API Issues**: GitHub Issues
- **Business Inquiries**: mail@kemalersin.com
- **Documentation**: `/api-docs` endpoint
- **MCP HTTP Server**: `http://localhost:3001/mcp/info`

---

🚀 **FonParam HTTP MCP ile AI destekli yatırım danışmanlığının geleceğini deneyimleyin!** 

## 🤖 **AI Agent Entegrasyon Yöntemleri:**

### 1. **Claude Desktop ile Doğrudan Konuşma**
HTTP MCP server'ınız Claude Desktop'ta çalışacak ve doğal dil ile konuşabileceksiniz:

```
<code_block_to_apply_changes_from>
```

### 2. **OpenAI API Function Calling ile Entegrasyon**

HTTP endpoint'lerinizi OpenAI function calling ile kullanabilirsiniz:
```
Kullanıcı: "AAK fonu ile 10.000 TL başlangıç yatırımı ve aylık 1.000 TL 
           düzenli yatırım yapsam, son 3 yılda enflasyon etkisi ile 
           birlikte ne kadar getiri elde ederim?"

Claude: "FonParam MCP server'ı kullanarak AAK fonunu analiz ediyorum..."
        [HTTP POST /mcp/tools/analyze_fund_investment çağrısı]
        
        📊 **ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU (AAK) Yatırım Analizi**
        
        💰 **Finansal Özet:**
        • Toplam Yatırım: 46.000 TL
        • Güncel Değer: 62.450 TL  
        • Nominal Getiri: 16.450 TL (%35.76)
        
        📈 **Enflasyon Analizi:**
        • Kümülatif Enflasyon: %127.45
        • Reel Getiri: -8.230 TL (%-17.89)
``` 