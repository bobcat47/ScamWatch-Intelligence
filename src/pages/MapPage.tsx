import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { MapPin, Radio, AlertTriangle, Phone, TrendingUp, Shield, Crosshair } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface CountryIntel {
  name: string; code: string; flag: string;
  lat: number; lng: number;
  reports: number;
  topScam: string;
  maxDanger: number;
  recentActivity: string;
}

const typeLabels: Record<string, string> = {
  investment_scam: "Investment", bank_impersonation: "Bank Impersonation",
  crypto_scam: "Crypto", police_threat: "Police Threat",
  phishing: "Phishing", harassment: "Harassment", spam: "Spam", other: "Other",
};

const typeColors: Record<string, string> = {
  investment_scam: "#dc2626", bank_impersonation: "#7c3aed",
  crypto_scam: "#f59e0b", police_threat: "#dc2626",
  phishing: "#2563eb", harassment: "#ea580c",
  spam: "#6b7280", other: "#4b5563",
};

const countryDataStatic: Omit<CountryIntel, "reports">[] = [
  { name: "Czechia", code: "CZ", flag: "🇨🇿", lat: 49.8175, lng: 15.4730,
    topScam: "Investment / Bank Impersonation", maxDanger: 94,
    recentActivity: "+420 770 135 9XX cluster active" },
  { name: "Slovakia", code: "SK", flag: "🇸🇰", lat: 48.6690, lng: 19.6990,
    topScam: "Cross-border harassment", maxDanger: 65,
    recentActivity: "+421 948 numbers linked to CZ op" },
  { name: "United Kingdom", code: "UK", flag: "🇬🇧", lat: 54.3781, lng: -3.4360,
    topScam: "HMRC / Bank fraud", maxDanger: 92,
    recentActivity: "Barclays + HMRC scams reported" },
  { name: "Germany", code: "DE", flag: "🇩🇪", lat: 51.1657, lng: 10.4515,
    topScam: "Bundespolizei impersonation", maxDanger: 96,
    recentActivity: "Caller ID spoofing active" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", lat: 52.1326, lng: 5.2913,
    topScam: "ING / ABN AMRO phishing", maxDanger: 93,
    recentActivity: "Belastingdienst scam season" },
];

const ZOOM_THRESHOLD = 5.5; // Switch from country to individual markers

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(3.5);

  const { data: stats } = trpc.report.stats.useQuery();
  const { data: mapReports } = trpc.report.mapData.useQuery();

  const countryData: CountryIntel[] = countryDataStatic.map((c) => ({
    ...c,
    reports: stats?.byCountry.find((s) => s.country === c.name)?.count || 0,
  }));

  // Build individual markers data
  const individualMarkers = (mapReports || []).map((r) => ({
    id: r.id,
    lat: parseFloat(r.latitude || "0"),
    lng: parseFloat(r.longitude || "0"),
    phoneNumber: r.phoneNumber,
    country: r.country,
    reportType: r.reportType,
    dangerRating: r.dangerRating,
    description: r.description,
    reportedAt: r.reportedAt,
  })).filter((m) => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== 0 && m.lng !== 0);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [10, 50],
      zoom: 3.5,
      attributionControl: false,
    });

    m.addControl(new maplibregl.NavigationControl(), "top-right");
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    m.on("load", () => setMapLoaded(true));
    m.on("zoom", () => setZoomLevel(m.getZoom()));

    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Render markers based on zoom level
  const renderMarkers = useCallback(() => {
    if (!map.current) return;

    // Clear all existing markers
    const existing = document.querySelectorAll(".maplibregl-marker");
    existing.forEach((el) => el.remove());

    if (!map.current) return;
    const m = map.current;
    const showIndividual = zoomLevel >= ZOOM_THRESHOLD;

    if (showIndividual) {
      individualMarkers.forEach((r) => {
        const color = typeColors[r.reportType] || "#6b7280";
        const size = r.dangerRating && r.dangerRating >= 90 ? 14 : r.dangerRating && r.dangerRating >= 75 ? 11 : 9;

        const el = document.createElement("div");
        el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:pointer;transition:transform 0.15s;`;
        el.onmouseenter = () => { el.style.transform = "scale(1.4)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };

        const popupHtml = `<div style="padding:6px;min-width:200px;max-width:260px;font-family:sans-serif;"><div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:3px;">${r.phoneNumber}</div><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};"></span><span style="font-size:11px;color:#64748b;">${typeLabels[r.reportType] || r.reportType}</span>${r.dangerRating ? `<span style="font-size:11px;font-weight:700;color:${r.dangerRating >= 90 ? '#dc2626' : '#d97706'};">${r.dangerRating}%</span>` : ''}</div><div style="font-size:11px;color:#475569;line-height:1.4;margin-bottom:4px;">${r.description?.substring(0, 90)}${(r.description?.length || 0) > 90 ? '...' : ''}</div><div style="font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:3px;">${r.country} &middot; ${new Date(r.reportedAt).toLocaleDateString()}</div></div>`;

        const popup = new maplibregl.Popup({ offset: 8, closeButton: false }).setHTML(popupHtml);
        new maplibregl.Marker({ element: el }).setLngLat([r.lng, r.lat]).setPopup(popup).addTo(m);
      });
    } else {
      countryData.forEach((c) => {
        if (c.reports === 0) return;
        const color = c.maxDanger >= 90 ? "#dc2626" : c.maxDanger >= 75 ? "#f59e0b" : "#eab308";
        const size = Math.min(48, 24 + c.reports * 1.5);

        const el = document.createElement("div");
        el.style.cssText = "position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;";
        el.innerHTML = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${Math.min(14, size / 2.5)}px;font-family:sans-serif;">${c.reports}</div><div style="position:absolute;width:${size + 12}px;height:${size + 12}px;border-radius:50%;background:${color};opacity:0.2;animation:pulse-ring 2s infinite;"></div><style>@keyframes pulse-ring{0%,100%{transform:scale(1);opacity:0.2;}50%{transform:scale(1.25);opacity:0.05;}}</style>`;

        const popupHtml = `<div style="padding:6px;min-width:180px;font-family:sans-serif;"><div style="font-weight:700;font-size:14px;margin-bottom:3px;">${c.flag} ${c.name}</div><div style="font-size:12px;color:#666;margin-bottom:2px;">${c.reports} reports</div><div style="font-size:11px;color:#dc2626;font-weight:600;">Max danger: ${c.maxDanger}%</div><div style="font-size:11px;color:#888;margin-top:4px;border-top:1px solid #eee;padding-top:4px;">${c.topScam}</div><div style="font-size:10px;color:#3b82f6;margin-top:4px;font-weight:500;">Zoom in to see individual threats</div></div>`;

        const popup = new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(popupHtml);
        new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).setPopup(popup).addTo(m);
      });
    }
  }, [zoomLevel, individualMarkers, countryData]);

  useEffect(() => {
    if (mapLoaded && map.current) {
      renderMarkers();
    }
  }, [mapLoaded, renderMarkers]);

  // Fly to a specific country
  const flyToCountry = (lng: number, lat: number) => {
    if (!map.current) return;
    map.current.flyTo({ center: [lng, lat], zoom: 6.5, duration: 1200 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-600" />
          <h1 className="text-xl font-bold text-slate-900">Threat Geography</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="hidden sm:flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-slate-400" />
            <span>Zoom: {zoomLevel.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span>{individualMarkers.length} mapped threats</span>
          </div>
        </div>
      </div>

      {/* Real Map */}
      <div className="glass-card mb-6 overflow-hidden" style={{ height: "560px" }}>
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full bg-slate-100">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-full" style={{ opacity: mapLoaded ? 1 : 0 }} />
      </div>

      {/* Zoom mode indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-slate-500">
          {zoomLevel >= ZOOM_THRESHOLD ? (
            <span className="text-emerald-600 font-medium">Showing individual threat markers</span>
          ) : (
            <span className="text-amber-600 font-medium">Showing country clusters — zoom in to see individual threats</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs">
        <span className="text-slate-500 font-medium">Scam Type:</span>
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
            <span className="text-slate-600">{typeLabels[type]}</span>
          </div>
        ))}
      </div>

      {/* Country Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {countryData.map((c) => (
          <div key={c.code} className="glass-card p-4 hover:border-amber-300 transition-all cursor-pointer" onClick={() => flyToCountry(c.lng, c.lat)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.flag}</span>
                <span className="font-bold text-slate-900 text-sm">{c.name}</span>
              </div>
              <div className={`text-xs font-bold px-2 py-0.5 ${c.maxDanger >= 90 ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"}`}>
                {c.maxDanger}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{c.reports} confirmed reports</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <AlertTriangle className="w-3 h-3 text-slate-400" />
                <span>Top: {c.topScam}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>{c.recentActivity}</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-blue-600 font-medium uppercase tracking-wider">Click to zoom in</div>
          </div>
        ))}
      </div>

      {/* Global Stats */}
      <div className="mt-6 glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Global Threat Summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats?.byType?.map((t) => (
            <div key={t.type} className="flex items-center justify-between">
              <span className="text-xs text-slate-600">{typeLabels[t.type] || t.type}</span>
              <span className="text-xs font-bold text-slate-900">{t.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
