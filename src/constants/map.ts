import type {
    ExpressionSpecification,
    LayerSpecification,
    SourceSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl'
import {
    HATCH_BACKSLASH,
    HATCH_HORIZONTAL,
    HATCH_SLASH,
    HATCH_VERTICAL,
    type HatchStyle,
} from '@/utils/hatch'

export const MAP_GLYPHS = `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${import.meta.env.VITE_MAPTILER_API_KEY}`

export const FOREST_COLOR = '#4caf50'
export const TRAIL_COLOR = '#e65100'
// Dash and gap length in pixels, same on the map (1px line) and in the export
const TRAIL_DASH = [3, 3]
export const SUMMIT_COLOR = '#795548'
export const SUMMIT_ICON_ID = 'summit-triangle'
// Triangle width in pixels, same on the map and in the export
export const SUMMIT_SIZE = 10
export const FOREST_LAYER_ID = 'forest'
export const BUILDING_LAYER_ID = 'buildings-fill'
export const BUILDING_HATCH_ID = 'buildings-hatch'
// GeoJSON source and line layer holding the forest hatch lines computed on the map
export const FOREST_HATCH_ID = 'forest-hatch'

const FOREST_HATCH: HatchStyle = {
    spacing: 12,
    angles: [HATCH_SLASH, HATCH_BACKSLASH, HATCH_HORIZONTAL, HATCH_VERTICAL],
}
const BUILDING_HATCH: HatchStyle = {
    spacing: 4,
    angles: [HATCH_BACKSLASH, HATCH_SLASH, HATCH_HORIZONTAL, HATCH_VERTICAL],
}

// Polygon layers drawn on the map as hatch lines: `layerId` is an invisible layer defining the
// polygons (and its hatch style in metadata), `hatchId` the GeoJSON source and line layer
export const HATCH_LAYERS = [
    { layerId: FOREST_LAYER_ID, hatchId: FOREST_HATCH_ID },
    { layerId: BUILDING_LAYER_ID, hatchId: BUILDING_HATCH_ID },
]

export const MAP_SOURCES: Record<string, SourceSpecification> = {
    basic: {
        type: 'vector',
        url: `https://api.maptiler.com/maps/basic-v2/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
    },
    contours: {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/contours-v2/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
    },
    planet: {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
    },
    [FOREST_HATCH_ID]: {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    },
    [BUILDING_HATCH_ID]: {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    },
}

// Read by the SVG export through the layer `metadata` field
// Value per zoom level as [zoom, value] pairs, linearly interpolated like a maplibre expression
export type ZoomStops = [number, number][]

const zoomExpression = (stops: ZoomStops): ExpressionSpecification => [
    'interpolate',
    ['linear'],
    ['zoom'],
    ...stops.flat(),
]

export const interpolateZoom = (stops: ZoomStops, zoom: number): number => {
    const upper = stops.findIndex(([z]) => z >= zoom)
    if (upper === -1) return stops[stops.length - 1]![1]
    if (upper === 0) return stops[0]![1]
    const [z0, v0] = stops[upper - 1]!
    const [z1, v1] = stops[upper]!
    return v0 + ((zoom - z0) / (z1 - z0)) * (v1 - v0)
}

// Roads are a black casing with a narrower white fill on top: two black edges on the map
const ROAD_CASING_WIDTH: ZoomStops = [
    [5, 2],
    [10, 4],
    [14, 6],
]
const ROAD_FILL_WIDTH: ZoomStops = [
    [5, 0.5],
    [10, 2],
    [14, 4],
]

export interface LayerExportStyle {
    stroke?: string
    hatch?: HatchStyle
    // SVG stroke-dasharray
    dash?: string
    // Point features drawn as a triangle, with their name and elevation when `label` is set
    marker?: 'triangle'
    label?: boolean
    // Lines drawn as the two edges of the road, as displayed on the map
    road?: { casing: ZoomStops; fill: ZoomStops }
    // Layer not exported on its own (e.g. drawn by another layer's export)
    skip?: boolean
}

const MAP_TEXT_LAYER: SymbolLayerSpecification = {
    id: 'roads-text',
    source: 'planet',
    type: 'symbol',
    'source-layer': 'transportation_name',
    layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
        'symbol-placement': 'line',
        visibility: 'none',
    },
    paint: {
        'text-color': '#555',
        'text-halo-color': '#fff',
        'text-halo-width': 1,
    },
}

export const MAP_LAYERS: LayerSpecification[] = [
    {
        // Invisible: only defines the forest features, drawn by the hatch layer below and the export
        id: FOREST_LAYER_ID,
        type: 'fill',
        source: 'planet',
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: {
            'fill-opacity': 0,
        },
        metadata: {
            export: { stroke: FOREST_COLOR, hatch: FOREST_HATCH } satisfies LayerExportStyle,
        },
    },
    {
        id: FOREST_HATCH_ID,
        type: 'line',
        source: FOREST_HATCH_ID,
        paint: {
            'line-color': FOREST_COLOR,
            'line-width': 1,
        },
    },
    {
        // Invisible: only defines the buildings, drawn by the hatch layer below and the export
        id: BUILDING_LAYER_ID,
        source: 'planet',
        'source-layer': 'building',
        type: 'fill',
        paint: {
            'fill-opacity': 0,
        },
        metadata: { export: { hatch: BUILDING_HATCH } satisfies LayerExportStyle },
    },
    {
        id: BUILDING_HATCH_ID,
        type: 'line',
        source: BUILDING_HATCH_ID,
        paint: {
            'line-color': '#000',
            'line-width': 1,
        },
    },
    {
        id: 'roads-line-major',
        type: 'line',
        source: 'planet',
        'source-layer': 'transportation',
        filter: [
            'in',
            ['get', 'class'],
            [
                'literal',
                [
                    'motorway',
                    'primary',
                    'trunk',
                    'minor',
                    'secondary',
                    'tertiary',
                    'residential',
                    'service',
                    'track',
                    'busway',
                    'raceway',
                ],
            ],
        ],
        paint: {
            'line-color': '#000000',
            'line-width': zoomExpression(ROAD_CASING_WIDTH),
        },
        metadata: {
            export: {
                road: { casing: ROAD_CASING_WIDTH, fill: ROAD_FILL_WIDTH },
            } satisfies LayerExportStyle,
        },
    },
    {
        id: 'road-fill',
        type: 'line',
        source: 'planet',
        'source-layer': 'transportation',
        filter: [
            'in',
            ['get', 'class'],
            [
                'literal',
                [
                    'motorway',
                    'primary',
                    'trunk',
                    'minor',
                    'secondary',
                    'tertiary',
                    'residential',
                    'service',
                    'track',
                    'busway',
                    'raceway',
                ],
            ],
        ],
        paint: {
            'line-color': [
                'match',
                ['get', 'class'],
                'motorway',
                '#ffffff', // yellow
                'primary',
                '#ffffff', // white
                'secondary',
                '#ffffff', // light gray
                'residential',
                '#ffffff', // very light gray
                '#ffffff', // fallback
            ],
            'line-width': zoomExpression(ROAD_FILL_WIDTH),
        },
        // Exported with the casing layer, as the road edges
        metadata: { export: { skip: true } satisfies LayerExportStyle },
    },
    {
        id: 'hiking-trails',
        type: 'line',
        source: 'planet',
        'source-layer': 'transportation',
        filter: [
            'all',
            ['==', ['get', 'class'], 'path'],
            ['in', ['get', 'subclass'], ['literal', ['path', 'footway', 'bridleway', 'steps']]],
        ],
        paint: {
            'line-color': TRAIL_COLOR,
            'line-width': 1,
            'line-dasharray': TRAIL_DASH,
        },
        metadata: {
            export: { stroke: TRAIL_COLOR, dash: TRAIL_DASH.join(' ') } satisfies LayerExportStyle,
        },
    },
    {
        id: 'water-line',
        type: 'line',
        source: 'planet',
        'source-layer': 'water',
        paint: {
            'line-color': '#000',
        },
    },
    {
        id: 'contour-lines',
        type: 'line',
        source: 'contours',
        'source-layer': 'contour',
        filter: ['!=', ['to-number', ['get', 'nth_line']], 5],
        paint: {
            'line-color': '#999',
            'line-width': 1,
        },
    },
    {
        id: 'contours-50m',
        type: 'line',
        source: 'contours',
        'source-layer': 'contour',
        filter: ['==', ['to-number', ['get', 'nth_line']], 5],
        layout: {
            visibility: 'visible',
        },
        paint: {
            'line-color': '#000',
            'line-width': 1.2,
        },
    },
    {
        id: 'boundary',
        type: 'line',
        source: 'planet',
        'source-layer': 'boundary',
        layout: {
            visibility: 'none',
        },
        paint: {
            'line-color': '#F00',
            'line-width': 1,
        },
    },
    /* {
        id: 'contour-ft-lines',
        type: 'line',
        source: 'contours',
        layout: {
            visibility: 'none',
        },
        'source-layer': 'contour_ft',
        paint: {
            'line-color': '#888',
            'line-width': 1,
        },
    }, */
    {
        id: 'summits',
        type: 'symbol',
        source: 'planet',
        'source-layer': 'mountain_peak',
        filter: ['in', ['get', 'class'], ['literal', ['peak', 'volcano']]],
        layout: {
            'icon-image': SUMMIT_ICON_ID,
            'icon-allow-overlap': true,
            'text-field': [
                'format',
                ['coalesce', ['get', 'name'], ''],
                {},
                '\n',
                {},
                ['case', ['has', 'ele'], ['concat', ['to-string', ['get', 'ele']], ' m'], ''],
                { 'font-scale': 0.85 },
            ],
            'text-font': ['Noto Sans Regular'],
            'text-size': 11,
            'text-anchor': 'top',
            'text-offset': [0, 0.7],
            'text-optional': true,
        },
        paint: {
            'text-color': SUMMIT_COLOR,
            'text-halo-color': '#fff',
            'text-halo-width': 1,
        },
        metadata: {
            export: {
                stroke: SUMMIT_COLOR,
                marker: 'triangle',
                label: true,
            } satisfies LayerExportStyle,
        },
    },
    MAP_TEXT_LAYER,
]
interface MapLayerLabelMapper {
    label: string
    layer_keys: string[]
}
export const MAP_LAYERS_LABELS: MapLayerLabelMapper[] = [
    {
        label: 'Contours',
        layer_keys: ['contour-lines', 'contours-50m'],
    },
    {
        label: 'Route',
        layer_keys: ['roads-line-major', 'road-fill'],
    },
    {
        label: 'Sentiers',
        layer_keys: ['hiking-trails'],
    },
    {
        label: 'Sommets',
        layer_keys: ['summits'],
    },
    {
        label: 'Immeuble',
        layer_keys: [BUILDING_LAYER_ID, BUILDING_HATCH_ID],
    },
    {
        label: 'Forêt',
        layer_keys: [FOREST_LAYER_ID, FOREST_HATCH_ID],
    },
    {
        label: 'Eau',
        layer_keys: ['water-line'],
    },
    {
        label: 'Limite',
        layer_keys: ['boundary'],
    },
]
