import { type LayerSpecification, type SourceSpecification } from 'maplibre-gl'

export const MAP_SOURCES: SourceSpecification = {
    contours: {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/contours-v2/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
    },
    planet: {
        type: 'vector',
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
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
        filter: ['!', ['in', ['get', 'class'], ['literal', ['ferry', 'boat', 'waterway']]]],
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
        paint: {
            'line-color': '#000',
            'line-width': 1,
        },
    },
]
