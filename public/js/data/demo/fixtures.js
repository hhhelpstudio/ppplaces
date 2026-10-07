// Sample data for demo mode. Real, well-known places with approximate
// coordinates and short descriptions written for this demo. Deliberately no
// ratings or reviews: inventing those for real businesses would be misleading.

/**
 * @typedef {object} DemoPlace
 * @property {string} id            Stable slug, prefixed into a `demo:` place_id.
 * @property {string} name
 * @property {string} type          One of the six mood types.
 * @property {string} area          Neighbourhood, shown where a rating would be.
 * @property {number} lat
 * @property {number} lng
 * @property {string} summary
 */

/**
 * @typedef {object} DemoCity
 * @property {string} id
 * @property {string} name
 * @property {string} country
 * @property {string[]} aliases
 * @property {number} lat
 * @property {number} lng
 * @property {DemoPlace[]} places
 */

/** @type {DemoCity[]} */
export const DEMO_CITIES = [
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    aliases: ["kyoto", "kyōto", "京都"],
    lat: 35.0036,
    lng: 135.7756,
    places: [
      { id: "fushimi-inari", name: "Fushimi Inari Taisha", type: "tourist_attraction", area: "Fushimi", lat: 34.9671, lng: 135.7727, summary: "Thousands of vermilion torii gates climbing Mount Inari. Go early or late to have the upper trails nearly to yourself." },
      { id: "kiyomizu-dera", name: "Kiyomizu-dera", type: "tourist_attraction", area: "Higashiyama", lat: 34.9949, lng: 135.785, summary: "A hillside temple with a vast wooden stage over the trees and the whole city spread out below." },
      { id: "gion-shirakawa", name: "Gion Shirakawa", type: "tourist_attraction", area: "Gion", lat: 35.0057, lng: 135.7756, summary: "A willow-lined canal of old teahouses, at its most atmospheric at dusk when the lanterns come on." },
      { id: "philosophers-path", name: "Philosopher's Path", type: "park", area: "Sakyo", lat: 35.027, lng: 135.7948, summary: "A quiet stone path along a cherry-lined canal, linking small temples between Ginkaku-ji and Nanzen-ji." },
      { id: "maruyama-park", name: "Maruyama Park", type: "park", area: "Higashiyama", lat: 35.0036, lng: 135.7814, summary: "The city's classic picnic park, centred on a famous weeping cherry tree." },
      { id: "honke-owariya", name: "Honke Owariya", type: "restaurant", area: "Nakagyo", lat: 35.013, lng: 135.76, summary: "A soba shop that has been serving noodles for centuries. Order the stacked lacquer-box soba." },
      { id: "omen-ginkakuji", name: "Omen Ginkakuji", type: "restaurant", area: "Sakyo", lat: 35.0255, lng: 135.793, summary: "Thick, chewy udon with seasonal vegetables. A good lunch stop on the Philosopher's Path." },
      { id: "arabica-higashiyama", name: "% Arabica Higashiyama", type: "cafe", area: "Higashiyama", lat: 34.9983, lng: 135.7801, summary: "A tiny, minimal espresso bar on the slope toward Yasaka Pagoda. Expect a short queue." },
      { id: "pontocho", name: "Pontocho Alley", type: "night_club", area: "Nakagyo", lat: 35.0059, lng: 135.7708, summary: "A narrow lantern-lit lane of bars and izakaya backing onto the Kamo River." },
      { id: "nishiki-market", name: "Nishiki Market", type: "shopping_mall", area: "Nakagyo", lat: 35.005, lng: 135.7649, summary: "Five blocks of food stalls known as Kyoto's kitchen. Snack your way from one end to the other." },
      { id: "teramachi", name: "Teramachi Arcade", type: "shopping_mall", area: "Nakagyo", lat: 35.0063, lng: 135.7672, summary: "A covered shopping street mixing old stationery and incense shops with newer boutiques." },
    ],
  },
  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    aliases: ["lisbon", "lisboa"],
    lat: 38.7107,
    lng: -9.1393,
    places: [
      { id: "sao-jorge", name: "São Jorge Castle", type: "tourist_attraction", area: "Alfama", lat: 38.7139, lng: -9.1335, summary: "Moorish castle walls on the city's highest hill, with peacocks in the gardens and views over the river." },
      { id: "belem-tower", name: "Belém Tower", type: "tourist_attraction", area: "Belém", lat: 38.6916, lng: -9.216, summary: "A small, ornate fortress standing in the river, built to guard the harbour during the Age of Discovery." },
      { id: "jeronimos", name: "Jerónimos Monastery", type: "tourist_attraction", area: "Belém", lat: 38.6979, lng: -9.2068, summary: "Lacy stone cloisters in the Manueline style. The cloister alone is worth the visit." },
      { id: "santa-luzia", name: "Miradouro de Santa Luzia", type: "park", area: "Alfama", lat: 38.7118, lng: -9.1301, summary: "A tiled, bougainvillea-covered terrace looking over Alfama's rooftops to the river." },
      { id: "jardim-estrela", name: "Jardim da Estrela", type: "park", area: "Estrela", lat: 38.7133, lng: -9.1597, summary: "A leafy neighbourhood garden with a duck pond, kiosk café and an old iron bandstand." },
      { id: "time-out-market", name: "Time Out Market", type: "restaurant", area: "Cais do Sodré", lat: 38.7069, lng: -9.146, summary: "A food hall gathering stalls from well-known local chefs under one roof." },
      { id: "ramiro", name: "Cervejaria Ramiro", type: "restaurant", area: "Intendente", lat: 38.721, lng: -9.1355, summary: "A loud, beloved seafood hall. Garlic prawns, clams, and a steak sandwich to finish." },
      { id: "pasteis-belem", name: "Pastéis de Belém", type: "cafe", area: "Belém", lat: 38.6975, lng: -9.2032, summary: "The original custard-tart bakery. Eat them warm with cinnamon and powdered sugar." },
      { id: "a-brasileira", name: "A Brasileira", type: "cafe", area: "Chiado", lat: 38.7107, lng: -9.1427, summary: "A historic art-nouveau café, a Chiado landmark since the early 1900s." },
      { id: "bairro-alto", name: "Bairro Alto", type: "night_club", area: "Bairro Alto", lat: 38.713, lng: -9.146, summary: "A grid of steep lanes where the bars spill into the street every night." },
      { id: "pink-street", name: "Pink Street", type: "night_club", area: "Cais do Sodré", lat: 38.707, lng: -9.144, summary: "A short, pink-painted street of late-night bars and music venues." },
      { id: "lx-factory", name: "LX Factory", type: "shopping_mall", area: "Alcântara", lat: 38.7033, lng: -9.1789, summary: "Old factory buildings turned into bookshops, studios, cafés and a Sunday market." },
      { id: "embaixada", name: "Embaixada", type: "shopping_mall", area: "Príncipe Real", lat: 38.716, lng: -9.149, summary: "Independent Portuguese design and fashion inside a restored 19th-century palace." },
    ],
  },
  {
    id: "ubud",
    name: "Ubud",
    country: "Bali, Indonesia",
    aliases: ["ubud", "bali", "ubud bali"],
    lat: -8.5069,
    lng: 115.2625,
    places: [
      { id: "ubud-palace", name: "Ubud Palace", type: "tourist_attraction", area: "Central Ubud", lat: -8.5069, lng: 115.2625, summary: "The royal palace at the heart of town, with traditional dance performances in its courtyard most evenings." },
      { id: "saraswati", name: "Saraswati Temple", type: "tourist_attraction", area: "Central Ubud", lat: -8.5067, lng: 115.2607, summary: "A temple fronted by a lotus pond. Especially lovely when the flowers are open." },
      { id: "monkey-forest", name: "Sacred Monkey Forest Sanctuary", type: "park", area: "Padangtegal", lat: -8.5188, lng: 115.2585, summary: "Mossy temples and giant banyan trees, home to hundreds of long-tailed macaques. Keep a firm grip on your sunglasses." },
      { id: "campuhan", name: "Campuhan Ridge Walk", type: "park", area: "Campuhan", lat: -8.503, lng: 115.254, summary: "An easy ridge-top trail through tall grass between two river valleys. Best at sunrise." },
      { id: "tegallalang", name: "Tegallalang Rice Terraces", type: "park", area: "Tegallalang", lat: -8.4335, lng: 115.279, summary: "Sweeping terraced rice fields north of town, carved into a steep valley." },
      { id: "ibu-oka", name: "Warung Babi Guling Ibu Oka", type: "restaurant", area: "Central Ubud", lat: -8.5063, lng: 115.2629, summary: "The famous spot for Balinese roast suckling pig. Arrive at lunchtime before it sells out." },
      { id: "bridges", name: "Bridges Bali", type: "restaurant", area: "Campuhan", lat: -8.505, lng: 115.254, summary: "Dinner on terraces stepping down to the river gorge beside the old bridge." },
      { id: "seniman", name: "Seniman Coffee Studio", type: "cafe", area: "Central Ubud", lat: -8.5065, lng: 115.261, summary: "A coffee lab roasting Indonesian beans, with a menu of brewing methods to choose from." },
      { id: "clear-cafe", name: "Clear Café", type: "cafe", area: "Central Ubud", lat: -8.5065, lng: 115.2655, summary: "A breezy, plant-filled café with juices, smoothie bowls and shoes-off seating." },
      { id: "laughing-buddha", name: "Laughing Buddha Bar", type: "night_club", area: "Monkey Forest Road", lat: -8.5114, lng: 115.264, summary: "A small bar with live music most nights, one of the livelier spots in quiet Ubud." },
      { id: "art-market", name: "Ubud Art Market", type: "shopping_mall", area: "Central Ubud", lat: -8.507, lng: 115.263, summary: "Stalls of woven baskets, sarongs, and carvings. Bargaining is expected and friendly." },
    ],
  },
];

export const DEMO_DEFAULT_CITY = "ubud";
