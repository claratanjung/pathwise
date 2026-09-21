const PREFERENCE_LABELS = {
  public: "transportasi umum",
  cheap: "hemat biaya",
  fast: "paling cepat",
  walk: "minim jalan kaki",
  transfer: "minim transit"
};

export function buildSystemPrompt({ preferences = [] }) {
  const prefText = preferences.length
    ? preferences.map((p) => PREFERENCE_LABELS[p] || p).join(", ")
    : "tidak ada preferensi khusus";

  return (
    "Kamu adalah RuteCerdas, asisten perencana rute transportasi umum di Indonesia. " +
    "Tugasmu menerjemahkan cerita perjalanan pengguna menjadi rekomendasi rute terstruktur. " +
    `Preferensi pengguna: ${prefText}. ` +
    "Ikuti aturan ini:\n" +
    "1. Ekstrak asal, tujuan, waktu berangkat, dan budget dari cerita pengguna. Jika tidak disebutkan, isi dengan 'Fleksibel' atau 'Belum ditentukan'.\n" +
    "2. Jika cerita tidak cukup untuk menentukan rute (misal tujuan tidak jelas), kembalikan JSON hanya dengan field 'clarification' berisi pertanyaan singkat berbahasa Indonesia.\n" +
    "3. Buat 1-3 opsi rute yang realistis dan masuk akal menggunakan moda transportasi umum (bus, KRL/kereta, MRT, angkot, dll). Hormati preferensi pengguna.\n" +
    "4. Setiap langkah rute disusun berurutan dari berangkat sampai tiba.\n" +
    "5. Seluruh teks menggunakan Bahasa Indonesia.\n" +
    "6. Keluarkan HANYA objek JSON, tanpa teks lain dan tanpa markdown.\n\n" +
    "Skema JSON:\n" +
    '{\n' +
    '  "origin": "string",\n' +
    '  "destination": "string",\n' +
    '  "departureTime": "string",\n' +
    '  "budget": "string",\n' +
    '  "routes": [\n' +
    '    {\n' +
    '      "title": "string",\n' +
    '      "badge": "string",\n' +
    '      "modes": ["string"],\n' +
    '      "duration": "string",\n' +
    '      "cost": "string",\n' +
    '      "transfers": "string",\n' +
    '      "walking": "string",\n' +
    '      "steps": [["tindakan", "waktu", "moda"]]\n' +
    '    }\n' +
    "  ]\n" +
    "}"
  );
}

export function buildUserMessage({ message, requestedOutput = [] }) {
  return `Cerita perjalanan: "${message}"\nField yang diminta: ${requestedOutput.join(", ")}`;
}