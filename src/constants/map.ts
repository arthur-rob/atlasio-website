import { type LayerSpecification, type SourceSpecification } from 'maplibre-gl'

export const MAP_GLYPHS = `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${import.meta.env.VITE_MAPTILER_API_KEY}`

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
}

const MAP_TEXT_LAYER: LayerSpecification = {
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
        id: 'buildings-line',
        type: 'line',
        source: 'planet',
        'source-layer': 'building',
        paint: {
            'line-color': '#8B4513',
            'line-opacity': 0.8,
        },
    },

    {
        id: 'roads-line',
        type: 'line',
        source: 'planet',
        'source-layer': 'transportation',
        filter: [
            'all',
            ['!', ['in', ['get', 'class'], ['literal', ['ferry', 'boat', 'waterway']]]],
            ['!', ['in', ['get', 'class'], ['literal', ['track', 'path']]]],
        ],
        paint: {
            'line-color': '#808080',
            'line-width': 1.5,
        },
    },
    {
        id: 'water-line',
        type: 'line',
        source: 'planet',
        'source-layer': 'water',
        paint: {
            'line-color': '#3399FF',
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
            'line-width': 1,
        },
    },
    {
        id: 'boundary',
        type: 'line',
        source: 'planet',
        'source-layer': 'boundary',
        layout: {
            visibility: 'visible',
        },
        paint: {
            'line-color': '#f00',
            'line-width': 1,
        },
    },
    {
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
    },
    MAP_TEXT_LAYER,
]
