interface AthleteRef {
    id: number
    resource_state: number
}

interface MapSummary {
    id: string
    summary_polyline: string
    resource_state: number
}

interface StravaActivity {
    resource_state: number
    athlete: AthleteRef
    name: string
    distance: number // meters
    moving_time: number // seconds
    elapsed_time: number // seconds
    total_elevation_gain: number // meters
    type: string // e.g. "Run"
    sport_type: string // e.g. "TrailRun"
    workout_type: number | null
    id: number
    start_date: string // ISO 8601 UTC string
    start_date_local: string // ISO 8601 local timezone string
    timezone: string
    utc_offset: number // seconds offset from UTC
    location_city: string | null
    location_state: string | null
    location_country: string | null
    achievement_count: number
    kudos_count: number
    comment_count: number
    athlete_count: number
    photo_count: number
    map: MapSummary
    trainer: boolean
    commute: boolean
    manual: boolean
    private: boolean
    visibility: string
    gear_id: string | null
    start_latlng: [number, number] | null // [lat, lng] or null
    end_latlng: [number, number] | null // [lat, lng] or null
    average_speed: number // m/s
    max_speed: number // m/s
    average_cadence?: number // rpm (optional if absent)
    average_temp?: number // °C (optional)
    average_watts?: number
    max_watts?: number
    weighted_average_watts?: number
    device_watts?: boolean
    kilojoules?: number
    has_heartrate?: boolean
    average_heartrate?: number | null
    max_heartrate?: number | null
    heartrate_opt_out?: boolean
    display_hide_heartrate_option?: boolean
    elev_high?: number
    elev_low?: number
    upload_id?: number
    upload_id_str?: string
    external_id?: string | null
    from_accepted_tag?: boolean
    pr_count?: number
    total_photo_count?: number
    has_kudoed?: boolean
}
