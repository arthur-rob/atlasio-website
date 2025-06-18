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
    MAP_TEXT_LAYER,
]
