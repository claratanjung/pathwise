# RuteCerdas AI — React + Backend

Website perbandingan rute dengan AI. Frontend React (Vite) + backend Express.

## Menjalankan project

```bash
npm install
```

Jalankan dua proses (terminal terpisah):

```bash
# Terminal 1: backend API (port 3000)
npm run server

# Terminal 2: frontend Vite (port 5173)
npm run dev
```

Buka URL Vite yang muncul, biasanya `http://localhost:5173`.
Vite mem-proxy `/api` ke backend, jadi frontend tidak perlu konfigurasi URL API.

## Struktur backend

```
server/
  index.js                  entry point express
  config.js                 konfigurasi (PORT, GROQ_API_KEY, GROQ_MODEL)
  routes/routeRouter.js     endpoint POST /api/route
  services/             
    aiService.js            orkestrasi prompt -> AI -> normalisasi
    groqClient.js           klien Groq (belum terpasang, tinggal diisi)
  prompts/routePrompt.js    builder system/user prompt
  utils/parseJson.js        ekstraksi + normalisasi JSON dari model
```

`groq-sdk` sengaja belum dipasang. Setelah siap, isi `server/services/groqClient.js`
untuk memanggil Groq dengan model `openai/gpt-oss-120b`, lalu `npm install groq-sdk`.

## Konfigurasi AI

Buat file `.env` di root project (contoh: `.env.example`):

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
PORT=3000
```

Selama `GROQ_API_KEY` kosong/backend belum terimplementasi, endpoint `/api/route`
mengembalikan error 501 dan frontend otomatis jatuh ke data simulasi.

### Endpoint

- `GET /api/health` — cek status server.
- `POST /api/route` — analisis rute.

Frontend mengirim POST JSON dengan format:

```json
{
  "message": "Saya dari Bogor mau ke Depok...",
  "preferences": ["public", "cheap"],
  "language": "id",
  "requestedOutput": [
    "origin",
    "destination",
    "departureTime",
    "budget",
    "preferences",
    "clarification",
    "routeOptions"
  ]
}
```

Contoh respons berhasil:

```json
{
  "origin": "Bogor",
  "destination": "Depok",
  "departureTime": "07.00",
  "budget": "Rp25.000",
  "routes": [
    {
      "title": "Rute Hemat",
      "badge": "Sesuai budget",
      "modes": ["KRL", "Jalan kaki"],
      "duration": "1 jam 20 menit",
      "cost": "Rp12.000",
      "transfers": "1 kali",
      "walking": "10 menit",
      "steps": [
        ["Menuju stasiun", "07.00 – 07.10", "Jalan kaki"],
        ["Naik KRL", "07.10 – 08.20", "KRL"]
      ]
    }
  ]
}
```

Jika informasi kurang, respons berisi `clarification` saja.

## Catatan

- API key jangan ditaruh di React/frontend.
- Data rute dari AI adalah estimasi, bukan jadwal transportasi real-time.
- Data fallback frontend hanya untuk demo.