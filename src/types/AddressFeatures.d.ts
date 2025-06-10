interface Geometry {
    type: string
    coordinates: [number, number]
    interpolated: boolean
}

interface Property {
    accuracy: string
    mapbox_id: string
}

interface ContextItem {
    id: string
}

interface AddressFeature {
    address: string
    center: [number, number]
    context: ContextItem[]
    geometry: Geometry
    id: string
    matching_place_name: string
    matching_text: string
    place_name: string
    place_type: string[]
    properties: Property
    relevance: number
    text: string
    type: string
}
