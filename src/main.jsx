import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "/api/route";

const prompts = [
  "Dari rumah ke kampus naik transportasi umum, hemat dan minim jalan kaki.",
  "Saya mau ke stasiun besok pagi, budget terbatas dan tidak ingin banyak transit.",
  "Dari Bogor ke Depok, tolong carikan pilihan rute yang praktis.",
  "Saya ingin rute paling cepat ke kampus dengan transportasi umum."
];

const mockResult = {
  origin: "Lokasi awal pengguna",
  destination: "Tujuan perjalanan",
  departureTime: "07.00",
  budget: "Rp25.000",
  routes: [
    {
      title: "Rute Hemat",
      badge: "Sesuai budget",
      modes: ["Jalan kaki", "Bus", "KRL"],
      duration: "1 jam 35 menit",
      cost: "Rp12.000",
      transfers: "2 kali",
      walking: "12 menit",
      steps: [
        ["Berjalan ke halte terdekat", "07.00 – 07.10", "Jalan kaki"],
        ["Naik bus menuju stasiun", "07.10 – 07.35", "Bus"],
        ["Transit di stasiun", "07.35 – 07.45", "Transit"],
        ["Naik KRL menuju stasiun tujuan", "07.45 – 08.35", "KRL"]
      ]
    },
    {
      title: "Rute Lebih Cepat",
      badge: "Waktu lebih singkat",
      modes: ["Ojol", "KRL"],
      duration: "1 jam 15 menit",
      cost: "Rp23.000",
      transfers: "1 kali",
      walking: "5 menit",
      steps: [
        ["Menuju stasiun dengan kendaraan penghubung", "07.00 – 07.15", "Transportasi"],
        ["Naik KRL menuju stasiun tujuan", "07.15 – 08.15", "KRL"]
      ]
    }
  ]
};

function App() {
  const [page, setPage] = useState("home");
  const [text, setText] = useState("");
  const [preferences, setPreferences] = useState(["public"]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rutecerdas-history") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("rutecerdas-history", JSON.stringify(history));
  }, [history]);

  const activeRoute = result?.routes?.[selectedRoute] || mockResult.routes[0];

  const canSearch = text.trim().length >= 10 && !loading;

  const togglePreference = (value) => {
    setPreferences((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const searchRoute = async () => {
    if (!canSearch) return;

    setLoading(true);
    setNotice("");

    const payload = {
      message: text,
      preferences,
      language: "id",
      requestedOutput: [
        "origin",
        "destination",
        "departureTime",
        "budget",
        "preferences",
        "clarification",
        "routeOptions"
      ]
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("API tidak tersedia");

      const data = await response.json();

      if (data.clarification) {
        setNotice(data.clarification);
        setResult(null);
      } else {
        setResult(data);
        setSelectedRoute(0);
        saveHistory(text, data);
        setPage("result");
      }
    } catch {
      // Fallback untuk demonstrasi frontend sebelum backend/API dipasang.
      const fallback = {
        ...mockResult,
        origin: "Lokasi yang disebutkan pengguna",
        destination: "Tujuan dari input pengguna"
      };
      setResult(fallback);
      setSelectedRoute(0);
      saveHistory(text, fallback);
      setNotice("Mode demo aktif: hasil berikut adalah simulasi. Hubungkan backend NLP dan routing API untuk data nyata.");
      setPage("result");
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = (query, data) => {
    setHistory((current) => [
      {
        id: Date.now(),
        query,
        destination: data.destination || "Tujuan belum diketahui",
        duration: data.routes?.[0]?.duration || "-",
        createdAt: new Date().toLocaleString("id-ID")
      },
      ...current
    ].slice(0, 10));
  };

  const usePrompt = (prompt) => {
    setText(prompt);
    setNotice("");
    setPage("home");
  };

  const resetSearch = () => {
    setText("");
    setResult(null);
    setNotice("");
    setPage("home");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={resetSearch} aria-label="Ke halaman utama">
          <span className="brand-icon">✦</span>
          <span>
            <strong>RuteCerdas</strong>
            <small>AI Travel Assistant</small>
          </span>
        </button>

        <nav className="desktop-nav">
          <button className={page === "home" ? "nav-active" : ""} onClick={() => setPage("home")}>Beranda</button>
          <button className={page === "result" ? "nav-active" : ""} onClick={() => result ? setPage("result") : setNotice("Cari rute terlebih dahulu.")}>Hasil Rute</button>
          <button className={page === "history" ? "nav-active" : ""} onClick={() => setPage("history")}>Riwayat</button>
        </nav>

        <button className="profile-button" onClick={() => setNotice("Profil pengguna dapat dikembangkan pada tahap berikutnya.")}>
          <span>CT</span>
          <span className="profile-label">Profil</span>
        </button>
      </header>

      <main className="main-content">
        {page === "home" && (
          <HomePage
            text={text}
            setText={setText}
            preferences={preferences}
            togglePreference={togglePreference}
            prompts={prompts}
            usePrompt={usePrompt}
            canSearch={canSearch}
            loading={loading}
            searchRoute={searchRoute}
            notice={notice}
            setNotice={setNotice}
          />
        )}

        {page === "result" && result && (
          <ResultPage
            result={result}
            activeRoute={activeRoute}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
            onBack={resetSearch}
            notice={notice}
            setPage={setPage}
          />
        )}

        {page === "history" && (
          <HistoryPage history={history} usePrompt={usePrompt} />
        )}
      </main>

      <footer className="footer">
        <span>RuteCerdas AI</span>
        <span>Prototype NLP + Routing API</span>
        <span>© 2026</span>
      </footer>

      <div className="mobile-nav">
        <button className={page === "home" ? "mobile-active" : ""} onClick={() => setPage("home")}>⌂<small>Beranda</small></button>
        <button className={page === "result" ? "mobile-active" : ""} onClick={() => result ? setPage("result") : setNotice("Cari rute terlebih dahulu.")}>⌁<small>Rute</small></button>
        <button className={page === "history" ? "mobile-active" : ""} onClick={() => setPage("history")}>◷<small>Riwayat</small></button>
      </div>
    </div>
  );
}

function HomePage({
  text, setText, preferences, togglePreference, prompts,
  usePrompt, canSearch, loading, searchRoute, notice, setNotice
}) {
  const preferenceOptions = [
    ["public", "🚌", "Transportasi umum"],
    ["cheap", "💰", "Hemat biaya"],
    ["fast", "⚡", "Paling cepat"],
    ["walk", "🚶", "Minim jalan kaki"],
    ["transfer", "🔄", "Minim transit"]
  ];

  return (
    <section className="page-grid">
      <div className="hero-copy">
        <div className="eyebrow"><span>✦</span> SMART ROUTE PLANNER</div>
        <h1>Ceritakan perjalananmu.<br /><span>Biarkan AI mencari jalannya.</span></h1>
        <p className="hero-description">
          Masukkan cerita perjalanan dengan bahasa sehari-hari.
          RuteCerdas membantu mengubah kebutuhanmu menjadi pilihan rute
          yang lebih mudah dipahami.
        </p>

        <div className="mini-stats">
          <div><strong>01</strong><span>Input bahasa alami</span></div>
          <div><strong>02</strong><span>Analisis kebutuhan</span></div>
          <div><strong>03</strong><span>Rekomendasi rute</span></div>
        </div>
      </div>

      <div className="search-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">MULAI PERJALANAN</span>
            <h2>Mau pergi ke mana?</h2>
          </div>
          <span className="heading-symbol">✦</span>
        </div>

        <label className="field-label" htmlFor="trip-description">Ceritakan kebutuhan perjalananmu</label>
        <textarea
          id="trip-description"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Contoh: Saya dari Bogor mau ke kampus di Depok besok jam 7 pagi. Saya ingin transportasi umum, budget maksimal 25 ribu, dan tidak mau jalan kaki terlalu jauh..."
          maxLength={1000}
        />
        <div className="textarea-footer">
          <span>Bahasa Indonesia · Long text</span>
          <span>{text.length}/1000</span>
        </div>

        <div className="prompt-heading">
          <span>💡</span>
          <strong>Contoh input</strong>
        </div>
        <div className="prompt-list">
          {prompts.map((prompt) => (
            <button key={prompt} className="prompt-chip" onClick={() => usePrompt(prompt)}>
              {prompt}<span>↗</span>
            </button>
          ))}
        </div>

        <div className="field-label preference-label">Preferensi perjalanan (opsional)</div>
        <div className="preference-grid">
          {preferenceOptions.map(([value, icon, label]) => (
            <button
              key={value}
              className={`preference-chip ${preferences.includes(value) ? "selected" : ""}`}
              onClick={() => togglePreference(value)}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>

        <button className="primary-button" disabled={!canSearch} onClick={searchRoute}>
          {loading ? "Menganalisis perjalanan..." : "Cari Rute dengan AI"} <span>→</span>
        </button>

        {notice && <div className="notice">{notice}</div>}

        <p className="privacy-note">🔒 Data demo tersimpan secara lokal. Jangan kirim informasi pribadi yang sensitif.</p>
      </div>

      <div className="feature-strip">
        <Feature icon="✦" title="Bahasa alami" text="Cukup ceritakan perjalananmu." />
        <Feature icon="◎" title="Preferensi personal" text="Sesuaikan biaya, waktu, dan transit." />
        <Feature icon="⌖" title="Visualisasi rute" text="Lihat detail jalur secara terstruktur." />
        <Feature icon="◷" title="Riwayat perjalanan" text="Akses pencarian sebelumnya." />
      </div>
    </section>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature-item">
      <div className="feature-icon">{icon}</div>
      <div><strong>{title}</strong><p>{text}</p></div>
    </div>
  );
}

function ResultPage({ result, activeRoute, selectedRoute, setSelectedRoute, onBack, notice, setPage }) {
  return (
    <section className="result-page">
      <div className="page-heading-row">
        <div>
          <button className="back-button" onClick={onBack}>← Kembali</button>
          <div className="eyebrow">HASIL ANALISIS AI</div>
          <h1>Pilihan rute untukmu</h1>
          <p>AI mengolah input menjadi gambaran perjalanan yang lebih terstruktur.</p>
        </div>
        <button className="secondary-button" onClick={() => window.print()}>⇩ Simpan / Cetak</button>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="trip-summary">
        <div><span>DARI</span><strong>📍 {result.origin}</strong></div>
        <div className="trip-arrow">→</div>
        <div><span>KE</span><strong>🎯 {result.destination}</strong></div>
        <div className="summary-detail"><span>BERANGKAT</span><strong>{result.departureTime || "Fleksibel"}</strong></div>
        <div className="summary-detail"><span>BUDGET</span><strong>{result.budget || "Belum ditentukan"}</strong></div>
      </div>

      <div className="result-layout">
        <div className="route-column">
          <div className="section-title-row">
            <h2>Rekomendasi rute</h2>
            <span className="result-count">{result.routes?.length || 0} opsi</span>
          </div>

          {(result.routes || []).map((route, index) => (
            <button
              key={`${route.title}-${index}`}
              className={`route-option ${selectedRoute === index ? "route-selected" : ""}`}
              onClick={() => setSelectedRoute(index)}
            >
              <div className="route-option-top">
                <span className="route-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{route.title}</h3>
                  <span className="route-badge">{route.badge}</span>
                </div>
                <span className="route-chevron">→</span>
              </div>
              <div className="mode-row">
                {(route.modes || []).map((mode) => <span key={mode}>{mode}</span>)}
              </div>
              <div className="route-metrics">
                <div><span>Durasi</span><strong>◷ {route.duration}</strong></div>
                <div><span>Biaya</span><strong>💳 {route.cost}</strong></div>
                <div><span>Transit</span><strong>↻ {route.transfers}</strong></div>
              </div>
            </button>
          ))}
        </div>

        <div className="route-detail-card">
          <div className="card-heading">
            <div><span className="section-kicker">DETAIL RUTE TERPILIH</span><h2>{activeRoute.title}</h2></div>
            <span className="heading-symbol">⌖</span>
          </div>

          <div className="map-placeholder">
            <div className="map-grid"></div>
            <div className="map-road road-one"></div>
            <div className="map-road road-two"></div>
            <div className="map-route">
              <span className="map-pin start">●</span>
              <span className="map-pin middle">●</span>
              <span className="map-pin end">●</span>
            </div>
            <div className="map-label start-label">Awal</div>
            <div className="map-label end-label">Tujuan</div>
            <div className="map-disclaimer">Ilustrasi peta · Integrasikan Maps API untuk jalur nyata</div>
          </div>

          <div className="detail-summary">
            <div><span>Total waktu</span><strong>{activeRoute.duration}</strong></div>
            <div><span>Estimasi biaya</span><strong>{activeRoute.cost}</strong></div>
            <div><span>Jalan kaki</span><strong>{activeRoute.walking}</strong></div>
          </div>

          <h3 className="timeline-title">Urutan perjalanan</h3>
          <div className="timeline">
            {(activeRoute.steps || []).map(([title, time, mode], index) => (
              <div className="timeline-item" key={`${title}-${index}`}>
                <div className="timeline-dot">{index + 1}</div>
                <div className="timeline-content">
                  <div className="timeline-top"><strong>{title}</strong><span>{mode}</span></div>
                  <p>{time}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="primary-button" onClick={() => setPage("home")}>Cari rute lain <span>→</span></button>
        </div>
      </div>

      <div className="warning-box">
        <strong>⚠️ Perlu diperhatikan</strong>
        <p>Estimasi waktu, tarif, dan jadwal harus diverifikasi melalui penyedia data transportasi. Prototype ini belum menjamin ketersediaan kendaraan secara real-time.</p>
      </div>
    </section>
  );
}

function HistoryPage({ history, usePrompt }) {
  return (
    <section className="history-page">
      <div className="page-heading-row">
        <div><div className="eyebrow">CATATAN PERJALANAN</div><h1>Riwayat pencarian</h1><p>Daftar input yang pernah kamu analisis di perangkat ini.</p></div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state"><span>◷</span><h2>Belum ada riwayat</h2><p>Mulai pencarian rute dari halaman beranda.</p></div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <button className="history-item" key={item.id} onClick={() => usePrompt(item.query)}>
              <div className="history-icon">⌖</div>
              <div className="history-text"><strong>{item.destination}</strong><p>{item.query}</p><small>{item.createdAt}</small></div>
              <div className="history-meta"><strong>{item.duration}</strong><span>→</span></div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);