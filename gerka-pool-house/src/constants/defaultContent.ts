import heroAvif from '../assets/images/gerka-hero.avif'
import heroPng from '../assets/images/gerka-hero.png'
import heroWebp from '../assets/images/gerka-hero.webp'
import diningAvif from '../assets/images/garden-dining.avif'
import diningPng from '../assets/images/garden-dining.png'
import diningWebp from '../assets/images/garden-dining.webp'
import roomAvif from '../assets/images/guest-room.avif'
import roomPng from '../assets/images/guest-room.png'
import roomWebp from '../assets/images/guest-room.webp'
import lakeAvif from '../assets/images/nearby-lake.avif'
import lakePng from '../assets/images/nearby-lake.png'
import lakeWebp from '../assets/images/nearby-lake.webp'
import poolAvif from '../assets/images/pool-terrace.avif'
import poolPng from '../assets/images/pool-terrace.png'
import poolWebp from '../assets/images/pool-terrace.webp'
import type { SiteContent } from '../types/content'

export const defaultSiteContent: SiteContent = {
  version: 5,
  brandName: 'Gerka Pool House',
  logoText: 'GPH',
  hero: {
    eyebrow: {
      pl: 'Prywatny dom z basenem',
      en: 'Private pool house',
    },
    slogan: {
      pl: 'Spokojny wypoczynek dla rodzin i grup, z basenem tylko dla Was.',
      en: 'A calm private stay for families and groups, with a pool reserved for you.',
    },
    lead: {
      pl: 'Wygodny dom do 12 osób z ogrodem, grillem, parkingiem i szybkim WiFi. Dobre miejsce na rodzinny weekend, wakacje albo spokojny wyjazd ze znajomymi.',
      en: 'A comfortable house for up to 12 guests with a garden, barbecue, parking and fast WiFi. A good place for a family weekend, holidays or a calm trip with friends.',
    },
    image: {
      src: heroPng,
      webp: heroWebp,
      avif: heroAvif,
    },
  },
  about: {
    title: {
      pl: 'Dom zaprojektowany wokół odpoczynku',
      en: 'A house designed around rest',
    },
    lead: {
      pl: 'Gerka Pool House daje swobodę prywatnego domu i wygodę pobytu przygotowanego pod wypoczynek. Cały obiekt jest do dyspozycji gości.',
      en: 'Gerka Pool House gives you the freedom of a private home and the comfort of a stay prepared for rest. The whole property is available to guests.',
    },
    body: {
      pl: 'Na miejscu czekają dwa pokoje, część dzienna, ogród, basen, miejsce do grillowania i spokojna strefa relaksu. Układ domu sprawdza się dla rodzin z dziećmi oraz grup znajomych, które chcą spędzić czas razem i mieć dla siebie prywatną przestrzeń.',
      en: 'The property offers two rooms, a living area, garden, swimming pool, barbecue space and a quiet relaxation zone. The layout works well for families with children and groups of friends who want to spend time together and enjoy private space.',
    },
    highlights: [
      {
        id: 'private-pool',
        icon: 'pool',
        title: { pl: 'Prywatny basen', en: 'Private pool' },
        description: {
          pl: 'Basen dostępny wyłącznie dla gości obiektu.',
          en: 'A pool reserved exclusively for property guests.',
        },
      },
      {
        id: 'families-groups',
        icon: 'relax',
        title: { pl: 'Rodziny i grupy', en: 'Families and groups' },
        description: {
          pl: 'Elastyczny układ pobytu od 1 do 12 osób.',
          en: 'Flexible stays for 1 to 12 guests.',
        },
      },
      {
        id: 'quiet-garden',
        icon: 'garden',
        title: { pl: 'Ogród i prywatność', en: 'Garden and privacy' },
        description: {
          pl: 'Zielona przestrzeń do odpoczynku, rozmów i wspólnych posiłków.',
          en: 'Green space for rest, conversation and shared meals.',
        },
      },
    ],
  },
  gallery: [
    {
      id: 'pool-terrace',
      title: { pl: 'Basen i taras', en: 'Pool and terrace' },
      alt: {
        pl: 'Prywatny basen przy domu Gerka Pool House',
        en: 'Private pool terrace at Gerka Pool House',
      },
      image: { src: poolPng, webp: poolWebp, avif: poolAvif },
    },
    {
      id: 'guest-room',
      title: { pl: 'Komfortowe wnętrza', en: 'Comfortable interiors' },
      alt: {
        pl: 'Jasne wnętrze pokoju dla gości w domu wakacyjnym',
        en: 'Bright guest room interior in a holiday house',
      },
      image: { src: roomPng, webp: roomWebp, avif: roomAvif },
    },
    {
      id: 'garden-dining',
      title: { pl: 'Grill i jadalnia w ogrodzie', en: 'Garden dining and barbecue' },
      alt: {
        pl: 'Zewnętrzna strefa grillowa i stół w ogrodzie',
        en: 'Outdoor barbecue zone and garden dining table',
      },
      image: { src: diningPng, webp: diningWebp, avif: diningAvif },
    },
    {
      id: 'nearby-lake',
      title: { pl: 'Okolica i trasy spacerowe', en: 'Area and walking routes' },
      alt: {
        pl: 'Jezioro i spokojna ścieżka spacerowa w okolicy obiektu',
        en: 'Lake and peaceful walking path near the property',
      },
      image: { src: lakePng, webp: lakeWebp, avif: lakeAvif },
    },
  ],
  amenities: [
    {
      id: 'pool',
      icon: 'pool',
      title: { pl: 'Basen', en: 'Swimming pool' },
      description: {
        pl: 'Prywatna strefa wodna do spokojnego wypoczynku w sezonie.',
        en: 'A private water area for peaceful seasonal relaxation.',
      },
    },
    {
      id: 'grill',
      icon: 'grill',
      title: { pl: 'Grill', en: 'Barbecue' },
      description: {
        pl: 'Miejsce do wspólnego gotowania i długich wieczorów.',
        en: 'A dedicated place for shared cooking and long evenings.',
      },
    },
    {
      id: 'garden',
      icon: 'garden',
      title: { pl: 'Ogród', en: 'Garden' },
      description: {
        pl: 'Przestrzeń do zabawy, rozmów i odpoczynku na świeżym powietrzu.',
        en: 'Outdoor space for play, conversation and unwinding.',
      },
    },
    {
      id: 'parking',
      icon: 'parking',
      title: { pl: 'Parking', en: 'Parking' },
      description: {
        pl: 'Wygodne miejsca parkingowe dostępne na terenie obiektu.',
        en: 'Convenient parking spaces available on the property.',
      },
    },
    {
      id: 'wifi',
      icon: 'wifi',
      title: { pl: 'WiFi', en: 'WiFi' },
      description: {
        pl: 'Stabilne połączenie do pracy zdalnej i rozrywki.',
        en: 'Reliable connection for remote work and entertainment.',
      },
    },
    {
      id: 'relax',
      icon: 'relax',
      title: { pl: 'Strefa relaksu', en: 'Relax zone' },
      description: {
        pl: 'Leżaki, taras i spokojne miejsca do regeneracji.',
        en: 'Loungers, terrace and quiet corners for recharging.',
      },
    },
  ],
  area: {
    title: {
      pl: 'Okolica na spokojne odkrywanie',
      en: 'Surroundings made for slow discovery',
    },
    lead: {
      pl: 'W pobliżu są miejsca na spacer, rodzinny obiad, dzień nad wodą i krótkie wycieczki po okolicy.',
      en: 'Nearby you will find places for walks, family meals, days by the water and short local trips.',
    },
    image: { src: lakePng, webp: lakeWebp, avif: lakeAvif },
    items: [
      {
        id: 'lakes',
        icon: 'lake',
        title: { pl: 'Jeziora', en: 'Lakes' },
        description: {
          pl: 'Naturalne miejsca do spacerów, plażowania i spokojnych zachodów słońca.',
          en: 'Natural places for walks, beach time and quiet sunsets.',
        },
        distance: { pl: 'w okolicy', en: 'nearby' },
      },
      {
        id: 'restaurants',
        icon: 'restaurant',
        title: { pl: 'Restauracje', en: 'Restaurants' },
        description: {
          pl: 'Lokalne kuchnie, rodzinne obiady i miejsca na wieczorne wyjście.',
          en: 'Local kitchens, family lunches and places for an evening out.',
        },
        distance: { pl: 'krótki dojazd', en: 'short drive' },
      },
      {
        id: 'walking-routes',
        icon: 'route',
        title: { pl: 'Trasy spacerowe', en: 'Walking routes' },
        description: {
          pl: 'Leśne i polne ścieżki dobre na poranek, rower lub spacer z dziećmi.',
          en: 'Forest and field paths for mornings, bikes or walks with children.',
        },
        distance: { pl: 'od wyjścia z obiektu', en: 'from the property' },
      },
      {
        id: 'places',
        icon: 'landmark',
        title: { pl: 'Miejsca warte odwiedzenia', en: 'Places worth visiting' },
        description: {
          pl: 'Krótkie wycieczki do lokalnych atrakcji można łatwo dopasować do długości pobytu.',
          en: 'Short trips to local attractions can be easily matched to the length of stay.',
        },
        distance: { pl: 'planowane indywidualnie', en: 'planned individually' },
      },
    ],
  },
  pricing: {
    room1Nightly: 500,
    room2Nightly: 300,
    room1Capacity: 6,
    maxGuests: 12,
    minStayNights: 1,
    currency: 'PLN',
    extraInfo: {
      pl: 'Cena jest szacunkowa i wymaga potwierdzenia przez właściciela po sprawdzeniu dostępności terminu.',
      en: 'The price is estimated and requires confirmation by the owner after checking availability.',
    },
  },
  faq: [
    {
      id: 'capacity',
      question: {
        pl: 'Ile osób może nocować w obiekcie?',
        en: 'How many people can stay at the property?',
      },
      answer: {
        pl: 'Maksymalna liczba gości całego obiektu wynosi 12 osób. Pokój 2 aktywuje się automatycznie przy rezerwacjach powyżej 6 osób.',
        en: 'The maximum capacity of the whole property is 12 guests. Room 2 is automatically included for bookings above 6 guests.',
      },
    },
    {
      id: 'pool',
      question: {
        pl: 'Czy basen jest prywatny?',
        en: 'Is the pool private?',
      },
      answer: {
        pl: 'Tak, basen jest dostępny wyłącznie dla gości Gerka Pool House w czasie zarezerwowanego pobytu.',
        en: 'Yes, the pool is available exclusively to Gerka Pool House guests during the booked stay.',
      },
    },
    {
      id: 'pricing',
      question: {
        pl: 'Jak działa wycena pobytu?',
        en: 'How is the stay price calculated?',
      },
      answer: {
        pl: 'Do 6 osób naliczana jest cena pokoju podstawowego. Powyżej 6 osób system dolicza pokój dodatkowy. Wynik mnożony jest przez liczbę nocy.',
        en: 'Up to 6 guests, the base room price applies. Above 6 guests, the additional room is added. The result is multiplied by the number of nights.',
      },
    },
    {
      id: 'booking-confirmation',
      question: {
        pl: 'Czy wysłanie formularza oznacza potwierdzoną rezerwację?',
        en: 'Does sending the form confirm the booking?',
      },
      answer: {
        pl: 'Nie. Formularz wysyła zapytanie rezerwacyjne. Właściciel potwierdzi dostępność terminu i dalsze kroki.',
        en: 'No. The form sends a booking inquiry. The owner will confirm date availability and next steps.',
      },
    },
  ],
  booking: {
    title: {
      pl: 'Sprawdź termin i wyślij zapytanie',
      en: 'Check dates and send an inquiry',
    },
    lead: {
      pl: 'Wybierz daty, liczbę gości i zobacz szacunkową cenę przed wysłaniem wiadomości do właściciela.',
      en: 'Choose dates and guest count to see an estimated price before sending your message to the owner.',
    },
    ownerEmail: 'rezerwacje@gerkapoolhouse.pl',
    confirmationSubject: {
      pl: 'Potwierdzenie wysłania zapytania',
      en: 'Booking inquiry confirmation',
    },
    confirmationBody: {
      pl: 'Dziękujemy za kontakt.\n\nTwoje zapytanie rezerwacyjne zostało przesłane do właściciela obiektu Gerka Pool House.\n\nWkrótce otrzymasz odpowiedź dotyczącą dostępności wybranego terminu.',
      en: 'Thank you for contacting us.\n\nYour booking inquiry has been sent to the owner of Gerka Pool House.\n\nYou will soon receive a reply about the availability of your selected dates.',
    },
  },
  contact: {
    phone: '',
    email: 'rezerwacje@gerkapoolhouse.pl',
    address: {
      pl: 'ul. Chełmińska 41, Czarże, woj. kujawsko-pomorskie',
      en: '41 Chelminska Street, Czarze, Kuyavian-Pomeranian Voivodeship, Poland',
    },
    mapEmbedUrl:
      'https://www.google.com/maps?q=41%20Che%C5%82mi%C5%84ska%2C%20Czar%C5%BCe%2C%20Wojew%C3%B3dztwo%20kujawsko-pomorskie%2C%20Polska&output=embed',
    facebookUrl: '',
    instagramUrl: '',
  },
  availability: [],
  seo: {
    home: {
      title: {
        pl: 'Gerka Pool House | Prywatny wypoczynek z basenem',
        en: 'Gerka Pool House | Private pool stay in Poland',
      },
      description: {
        pl: 'Gerka Pool House to komfortowy obiekt noclegowy z prywatnym basenem, ogrodem, grillem, parkingiem i miejscem dla rodzin oraz grup do 12 osób.',
        en: 'Gerka Pool House is a comfortable accommodation with a private pool, garden, barbecue, parking and space for families and groups of up to 12 guests.',
      },
      canonicalPath: '/',
      ogImage: heroWebp,
    },
    admin: {
      title: {
        pl: 'Panel administratora | Gerka Pool House',
        en: 'Admin panel | Gerka Pool House',
      },
      description: {
        pl: 'Panel zarządzania treścią, galerią, cennikiem, FAQ, rezerwacjami i SEO obiektu Gerka Pool House.',
        en: 'Management panel for content, gallery, pricing, FAQ, reservations and SEO of Gerka Pool House.',
      },
      canonicalPath: '/admin',
      ogImage: heroWebp,
    },
    privacy: {
      title: {
        pl: 'Polityka prywatności | Gerka Pool House',
        en: 'Privacy Policy | Gerka Pool House',
      },
      description: {
        pl: 'Informacje o przetwarzaniu danych osobowych w związku z obsługą zapytań Gerka Pool House.',
        en: 'Information about personal data processing related to Gerka Pool House inquiries.',
      },
      canonicalPath: '/privacy',
      ogImage: heroWebp,
    },
    cookies: {
      title: {
        pl: 'Polityka cookies | Gerka Pool House',
        en: 'Cookie Policy | Gerka Pool House',
      },
      description: {
        pl: 'Informacje o plikach cookies, analityce i narzędziach pomiarowych na stronie Gerka Pool House.',
        en: 'Information about cookies, analytics and measurement tools on the Gerka Pool House website.',
      },
      canonicalPath: '/cookies',
      ogImage: heroWebp,
    },
  },
  updatedAt: new Date().toISOString(),
}
