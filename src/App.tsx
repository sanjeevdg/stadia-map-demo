import React, { useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '@maplibre/maplibre-gl-leaflet';

const { BaseLayer } = LayersControl;

const MAP_CENTER: [number, number] = [51.505, -0.09];
const MAP_ZOOM = 13;

const STADIA_RASTER_URL =
  'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=b1eaa277-afbb-4968-b2de-a804eb44d959';
const STADIA_ATTR =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, ' +
  '&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors';

const STADIA_VECTOR_STYLE_URL =
  'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=b1eaa277-afbb-4968-b2de-a804eb44d959';

// Component to add MapLibre vector layer
function VectorTileLayer() {
  const map = useMap();

  useEffect(() => {
    const vectorLayer = (L as any).maplibreGL({
      style: STADIA_VECTOR_STYLE_URL,
      attribution: STADIA_ATTR,
    });
    vectorLayer.addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(vectorLayer);
    };
  }, [map]);

  return null;
}

export default function App() {
  return (
    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100vh' }}>
      <LayersControl position="topright">
        <BaseLayer checked name="Raster">
          <TileLayer url={STADIA_RASTER_URL} attribution={STADIA_ATTR} />
        </BaseLayer>
        <BaseLayer name="Vector">
          {/* When Vector is selected, we add the MapLibre layer */}
          <VectorTileLayer />
        </BaseLayer>
      </LayersControl>
    </MapContainer>
  );
}

