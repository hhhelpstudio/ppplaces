// Shared JSDoc types. Checked by TypeScript (`npm run typecheck`) with no
// build step: the browser runs these files exactly as written.

/**
 * @typedef {{ lat: number, lng: number }} LatLng
 */

/**
 * A place as returned by search (Basic-tier fields only, PRD Section 4.2).
 * @typedef {object} Place
 * @property {string} place_id
 * @property {string} display_name
 * @property {number | null} [rating]
 * @property {number | null} [user_rating_count]
 * @property {string | null} [primary_type]
 * @property {string | null} [photo_ref]
 * @property {number | null} lat
 * @property {number | null} lng
 * @property {string} [area]        Demo mode only: neighbourhood label shown instead of a rating.
 */

/**
 * On-demand detail fields, fetched only for the one place the user opens.
 * @typedef {object} RichMetadata
 * @property {string | null} [formatted_address]
 * @property {string | null} [phone]
 * @property {string | null} [website]
 * @property {string | null} [editorial_summary]
 * @property {string | null} [price_level]
 * @property {{ weekdayDescriptions?: string[] } | null} [opening_hours]
 * @property {{ rating: number, text?: string }[]} [reviews]
 * @property {string[]} [photos]
 */

/**
 * @typedef {object} PlaceDetail
 * @property {RichMetadata | null} [rich_metadata]
 * @property {string | null} [photo_ref]
 */

/**
 * @typedef {object} GeocodeResult
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {string} [formatted_address]
 */

/**
 * @typedef {"dream" | "planning"} TripMode
 */

/**
 * @typedef {object} Trip
 * @property {string} id
 * @property {string} title
 * @property {TripMode} mode
 * @property {number} lat
 * @property {number} lng
 * @property {string | null} [location_name]
 * @property {string} [created_at]
 */

/**
 * @typedef {object} Day
 * @property {string} id
 * @property {number} order_index
 * @property {string | null} trip_date
 */

/**
 * A saved stop: the stop row joined with its cached place fields.
 * @typedef {Place & { id: string, order_index: number, time_lock?: string | null, visited_at?: string | null }} Stop
 */

/**
 * Storage for trips, days and stops. Two implementations share this shape:
 * Supabase (real mode) and localStorage (demo mode).
 * @typedef {object} TripsBackend
 * @property {() => Promise<void>} ensureSession
 * @property {() => Promise<Trip[]>} listTrips
 * @property {(input: { title: string, lat: number, lng: number, locationName?: string }) => Promise<Trip>} createTrip
 * @property {(tripId: string, title: string) => Promise<void>} renameTrip
 * @property {(tripId: string) => Promise<void>} deleteTrip
 * @property {(tripId: string, mode: TripMode) => Promise<void>} setTripMode
 * @property {(tripId: string) => Promise<Day[]>} listDays
 * @property {(tripId: string, orderIndex: number) => Promise<Day>} createDay
 * @property {(tripId: string) => Promise<Day>} ensureFirstDay
 * @property {(dayId: string) => Promise<void>} deleteDay
 * @property {(dayId: string, date: string) => Promise<void>} setDayDate
 * @property {(dayId: string) => Promise<Stop[]>} listStops
 * @property {(dayId: string, place: Place) => Promise<Stop | null>} addStop
 * @property {(stopId: string) => Promise<void>} removeStop
 * @property {(orderedStopIds: string[]) => Promise<void>} reorderStops
 * @property {(stopId: string, visitedAt: string) => Promise<void>} setStopVisited
 */

export {};
