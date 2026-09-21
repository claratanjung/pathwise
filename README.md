# RuteCerdas AI — React Prototype

## Menjalankan project

```bash
npm install
npm run dev
```

Buka URL Vite yang muncul, biasanya:
`http://localhost:5173`

## Menghubungkan API

Buat file `.env` di root project:

```env
VITE_API_URL=http://localhost:3000/api/route
```

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

Jika API gagal atau belum tersedia, aplikasi otomatis memakai data simulasi agar tampilan tetap dapat diuji.

## Catatan

- API key jangan ditaruh di React/frontend.
- Gunakan backend untuk memanggil Gemini/OpenAI dan routing API.
- Data rute pada fallback hanya untuk demo, bukan jadwal transportasi nyata.
"# pathwise" 
