"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom green marker for available turfs
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Grey marker for fully booked
const greyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Gold marker for selected
const goldIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FlyToSelected({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.flyTo([selected.lat, selected.lng], 15, { duration: 1 });
    }
  }, [selected, map]);
  return null;
}

export default function MapView({ turfs, selected, onSelect }) {
  return (
    <MapContainer
      center={[23.7808, 90.4093]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToSelected selected={selected} />

      {turfs.map((turf) => (
        <Marker
          key={turf.id}
          position={[turf.lat, turf.lng]}
          icon={selected?.id === turf.id ? goldIcon : turf.slots > 0 ? greenIcon : greyIcon}
          eventHandlers={{ click: () => onSelect(turf) }}
        >
          <Popup>
            <div style={{ minWidth: "160px" }}>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{turf.name}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{turf.area}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#10b981", marginTop: "6px" }}>
                ৳{turf.price.toLocaleString()}/hr
              </div>
              <div style={{ fontSize: "12px", marginTop: "4px", color: turf.slots > 0 ? "#10b981" : "#9ca3af" }}>
                {turf.slots > 0 ? `${turf.slots} slots open` : "Fully booked"}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}