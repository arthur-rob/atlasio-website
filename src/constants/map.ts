import type { LayerSpecification, SourceSpecification, SymbolLayerSpecification } from 'maplibre-gl'

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
// GeoJSON source and line layer holding the forest hatch lines computed on the map
export const FOREST_HATCH_ID = 'forest-hatch'

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
}

// Read by the SVG export through the layer `metadata` field
export interface LayerExportStyle {
    stroke?: string
    hatch?: boolean
    // SVG stroke-dasharray
    dash?: string
    // Point features drawn as a triangle, with their name and elevation when `label` is set
    marker?: 'triangle'
    label?: boolean
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
        metadata: { export: { stroke: FOREST_COLOR, hatch: true } satisfies LayerExportStyle },
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
        id: 'buildings-fill',
        source: 'planet',
        'source-layer': 'building',
        type: 'fill',
        paint: {
            'fill-color': '#222',
            'fill-opacity': 1,
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
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 4, 14, 6],
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
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 10, 2, 14, 4],
        },
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
        layer_keys: ['buildings-fill'],
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
