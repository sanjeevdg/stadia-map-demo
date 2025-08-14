import React, { useEffect, useState, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  LayersControl,
  ScaleControl,
} from 'react-leaflet'
import L, { Layer, LatLngTuple } from 'leaflet'
import { createLayerComponent } from '@react-leaflet/core'
import 'leaflet/dist/leaflet.css'
import maplibregl from 'maplibre-gl'
import '@maplibre/maplibre-gl-leaflet'

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STADIA_API_KEY = 'b1eaa277-afbb-4968-b2de-a804eb44d959'

// --- MapLibre wrapper ---
const createMapLibreLayer = (props: any, context: any) => {
  const { styleUrl, attribution, interactive = true } = props
  const layer = (L as any).maplibreGL({
    style: styleUrl,
    attribution,
    interactive,
    maplibreOptions: { maplibregl },
  }) as Layer
  return { instance: layer, context }
}

const updateMapLibreLayer = (instance: Layer, props: any, prevProps: any) => {
  if (props.styleUrl !== prevProps.styleUrl) {
    ;(instance as any).getMaplibreMap()?.setStyle(props.styleUrl)
  }
  return null
}

const MapLibreLayer = createLayerComponent<Layer, any>(
  createMapLibreLayer,
  updateMapLibreLayer
)

// --- GeoJSON Types ---
interface GeoJSONFeature {
  type: string
  geometry: { type: string; coordinates: any }
  properties?: Record<string, any>
}

interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// --- Hardcoded Markers ---
const extraMarkers = [
  {
    name: 'New York City',
    coords: [40.7128, -74.006] as LatLngTuple,
    desc: 'The Big Apple 🍎',
  },
  {
    name: 'Los Angeles',
    coords: [34.0522, -118.2437] as LatLngTuple,
    desc: 'City of Angels 🌴',
  },
  {
    name: 'Chicago',
    coords: [41.8781, -87.6298] as LatLngTuple,
    desc: 'Windy City 🌬️',
  },
]

export default function StadiaGeoJSONMapRemote() {
  const center = useMemo<LatLngTuple>(() => [37.8, -96], [])

  const rasterUrl = `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`
  const attribution =
    "&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>, &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
  const vectorStyle = `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=${STADIA_API_KEY}`

  const [geojsonData, setGeojsonData] = useState<GeoJSONData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const geojsonUrl =
    'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'

  useEffect(() => {
    setLoading(true)
    fetch(geojsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setGeojsonData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [geojsonUrl])

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      {loading && <div>Loading map data...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <ScaleControl position="bottomleft" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Stadia Raster">
            <TileLayer url={rasterUrl} attribution={attribution} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Stadia Vector (MapLibre)">
            <MapLibreLayer styleUrl={vectorStyle} attribution={attribution} />
          </LayersControl.BaseLayer>

          {/* Hardcoded Markers */}
          <LayersControl.Overlay checked name="Extra Markers">
            <div>
              {extraMarkers.map((m, i) => (
                <Marker key={i} position={m.coords}>
                  <Popup>
                    <b>{m.name}</b>
                    <br />
                    {m.desc}
                    <br />
                    {m.coords[0].toFixed(4)}, {m.coords[1].toFixed(4)}
                  </Popup>
                </Marker>
              ))}
            </div>
          </LayersControl.Overlay>

          {/* Remote GeoJSON Polygons */}
          {geojsonData?.features && (
            <LayersControl.Overlay checked name="GeoJSON Polygons">
              <div>
                {geojsonData.features
                  .filter((f) => f.geometry.type === 'Polygon')
                  .map((f, i) => (
                    <Polygon
                      key={i}
                      positions={f.geometry.coordinates.map((ring: number[][]) =>
                        ring.map((c: number[]) => [c[1], c[0]] as LatLngTuple)
                      )}
                    />
                  ))}
              </div>
            </LayersControl.Overlay>
          )}
        </LayersControl>
      </MapContainer>
    </div>
  )
}


