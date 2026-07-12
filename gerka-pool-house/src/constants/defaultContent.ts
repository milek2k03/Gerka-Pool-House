import diningAvif from '../assets/images/garden-dining.avif'
import diningWebp from '../assets/images/garden-dining.webp'
import roomAvif from '../assets/images/guest-room.avif'
import roomWebp from '../assets/images/guest-room.webp'
import lakeAvif from '../assets/images/nearby-lake.avif'
import lakeWebp from '../assets/images/nearby-lake.webp'
import poolAvif from '../assets/images/pool-terrace.avif'
import poolWebp from '../assets/images/pool-terrace.webp'
import type { SiteContent } from '../types/content'

const socialPreviewImage = '/og-image-real.jpg?v=7'
const heroBackgroundImage = '/newBackground.webp'

export const defaultSiteContent: SiteContent = {
  version: 24,
  brandName: 'Gerka Pool House',
  logoText: 'GPH',
  hero: {
    eyebrow: {
      pl: 'Nocleg niedaleko Bydgoszczy',
      en: 'Stay near Bydgoszcz',
    },
    slogan: {
      pl: 'Prywatny wypoczynek w Czarżu, blisko Bydgoszczy, Chełmna i Dąbrowy Chełmińskiej.',
      en: 'A private stay in Czarze, close to Bydgoszcz, Chelmno and Dabrowa Chelminska.',
    },
    lead: {
      pl: 'Gerka Pool House w Czarżu to wygodny nocleg niedaleko Bydgoszczy, Chełmna i Dąbrowy Chełmińskiej, z prywatną strefą basenową, ogrodem, grillem, parkingiem i szybkim WiFi.',
      en: 'Gerka Pool House in Czarze is a comfortable stay near Bydgoszcz, Chelmno and Dabrowa Chelminska, with a private pool area, garden, barbecue, parking and fast WiFi.',
    },
    image: {
      src: heroBackgroundImage,
      webp: heroBackgroundImage,
    },
    mobileImage: {
      src: heroBackgroundImage,
      webp: heroBackgroundImage,
    },
  },
  about: {
    title: {
      pl: 'Apartament na parterze i prywatna strefa basenowa',
      en: 'Ground-floor apartment and a private pool area',
    },
    lead: {
      pl: 'Aktualnie rezerwowany jest komfortowy apartament na parterze w Czarżu, niedaleko Bydgoszczy, Chełmna i Dąbrowy Chełmińskiej.',
      en: 'The currently available stay is a comfortable ground-floor apartment in Czarze, near Bydgoszcz, Chelmno and Dabrowa Chelminska.',
    },
    body: {
      pl: '#### Apartament na parterze\nPrzeznaczony dla maksymalnie 6 osób.\n\nOferuje:\n* przestronny salon z wygodną rozkładaną sofą,\n* w pełni wyposażoną kuchnię,\n* 2 komfortowe sypialnie,\n* łazienkę,\n* bezpośrednie wyjście do ogrodu i strefy basenowej.\n\nDo dyspozycji gości jest podgrzewany prywatny basen z leżakami, taras do wspólnego biesiadowania, miejsce do grillowania oraz przestrzeń do relaksu w otoczeniu zieleni.\n\nTo idealne miejsce na rodzinne wakacje, weekendowy wypoczynek lub spotkania w gronie przyjaciół.',
      en: '#### Ground-floor apartment\nDesigned for up to 6 guests.\n\nIt offers:\n* a spacious living room with a comfortable sofa bed,\n* a fully equipped kitchen,\n* 2 comfortable bedrooms,\n* a bathroom,\n* direct access to the garden and pool area.\n\nGuests can enjoy a heated private swimming pool with loungers, a terrace for shared meals, a barbecue area and a relaxing green outdoor space.\n\nIt is an ideal place for family holidays, weekend breaks and gatherings with friends.',
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
          pl: 'Komfortowy pobyt dla maksymalnie 6 osób.',
          en: 'A comfortable stay for up to 6 guests.',
        },
      },
      {
        id: 'quiet-garden',
        icon: 'firepit',
        title: { pl: 'Palenisko', en: 'Firepit' },
        description: {
          pl: 'Klimatyczne miejsce na wieczorne rozmowy, odpoczynek i wspólny czas przy ogniu.',
          en: 'A cosy outdoor spot for evening conversations, relaxing and spending time together by the fire.',
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
      image: { src: poolWebp, webp: poolWebp, avif: poolAvif },
    },
    {
      id: 'guest-room',
      title: { pl: 'Komfortowe wnętrza', en: 'Comfortable interiors' },
      alt: {
        pl: 'Jasne wnętrze apartamentu dla gości w domu wakacyjnym',
        en: 'Bright guest apartment interior in a holiday house',
      },
      image: { src: roomWebp, webp: roomWebp, avif: roomAvif },
    },
    {
      id: 'garden-dining',
      title: { pl: 'Grill i jadalnia w ogrodzie', en: 'Garden dining and barbecue' },
      alt: {
        pl: 'Zewnętrzna strefa grillowa i stół w ogrodzie',
        en: 'Outdoor barbecue zone and garden dining table',
      },
      image: { src: diningWebp, webp: diningWebp, avif: diningAvif },
    },
    {
      id: 'nearby-lake',
      title: { pl: 'Okolica i trasy spacerowe', en: 'Area and walking routes' },
      alt: {
        pl: 'Jezioro i spokojna ścieżka spacerowa w okolicy obiektu',
        en: 'Lake and peaceful walking path near the property',
      },
      image: { src: lakeWebp, webp: lakeWebp, avif: lakeAvif },
    },
  ],
  gallerySections: [
    {
      id: 'apartment-1',
      title: { pl: 'Apartament 1', en: 'Apartment 1' },
      lead: {
        pl: 'Galeria zdjęć apartamentu na parterze.',
        en: 'Photo gallery of the ground-floor apartment.',
      },
      items: [
        {
          id: 'apartment-1-room',
          title: { pl: 'Apartament na parterze', en: 'Ground-floor apartment' },
          alt: {
            pl: 'Jasne wnętrze apartamentu na parterze w Gerka Pool House',
            en: 'Bright interior of the ground-floor apartment at Gerka Pool House',
          },
          image: { src: roomWebp, webp: roomWebp, avif: roomAvif },
        },
      ],
    },
    {
      id: 'apartment-2',
      title: { pl: 'Apartament 2', en: 'Apartment 2' },
      lead: {
        pl: 'Galeria zdjęć apartamentu na piętrze.',
        en: 'Photo gallery of the first-floor apartment.',
      },
      items: [
        {
          id: 'apartment-2-room',
          title: { pl: 'Apartament na piętrze', en: 'First-floor apartment' },
          alt: {
            pl: 'Komfortowe wnętrze apartamentu na piętrze w Gerka Pool House',
            en: 'Comfortable interior of the first-floor apartment at Gerka Pool House',
          },
          image: { src: roomWebp, webp: roomWebp, avif: roomAvif },
        },
      ],
    },
    {
      id: 'terrace-pool',
      title: { pl: 'Taras i Strefa Basenowa', en: 'Terrace and Pool Area' },
      lead: {
        pl: 'Basen, leżaki, taras, grill i wieczorna strefa wypoczynku.',
        en: 'Pool, loungers, terrace, barbecue and evening relaxation area.',
      },
      items: [
        {
          id: 'terrace-pool-main',
          title: { pl: 'Basen i leżaki', en: 'Pool and loungers' },
          alt: {
            pl: 'Prywatny basen z leżakami przy Gerka Pool House',
            en: 'Private swimming pool with loungers at Gerka Pool House',
          },
          image: { src: poolWebp, webp: poolWebp, avif: poolAvif },
        },
        {
          id: 'terrace-dining',
          title: { pl: 'Taras i grill', en: 'Terrace and barbecue' },
          alt: {
            pl: 'Taras z miejscem do grillowania i wspólnego odpoczynku',
            en: 'Terrace with barbecue and shared relaxation space',
          },
          image: { src: diningWebp, webp: diningWebp, avif: diningAvif },
        },
      ],
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
        pl: 'Wygodna strefa grillowa do przygotowywania posiłków i wspólnych letnich kolacji.',
        en: 'A comfortable barbecue area for preparing meals and enjoying shared summer dinners.',
      },
    },
    {
      id: 'garden',
      icon: 'firepit',
      title: { pl: 'Palenisko', en: 'Firepit' },
      description: {
        pl: 'Miejsce na wieczorne rozmowy, ciepły klimat i spokojny odpoczynek przy ogniu.',
        en: 'A cosy place for evening conversations, a warm atmosphere and relaxing by the fire.',
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
      pl: 'Czarże, Bydgoszcz, Chełmno i Dąbrowa Chełmińska dają spokojną bazę na nocleg, spacery, rodzinny obiad, dzień nad wodą i krótkie wycieczki po okolicy.',
      en: 'Czarze, Bydgoszcz, Chelmno and Dabrowa Chelminska make a calm base for a stay, walks, family meals, days by the water and short local trips.',
    },
    image: { src: lakeWebp, webp: lakeWebp, avif: lakeAvif },
    items: [
      {
        id: 'ostromecko-palace',
        icon: 'landmark',
        title: { pl: 'Pałac w Ostromecku', en: 'Ostromecko Palace' },
        description: {
          pl: 'Historyczny zespół pałacowo-parkowy z elegancką architekturą, zielenią i spokojnymi alejkami spacerowymi. Możliwy jest bezpośredni dojazd PKS-em, a po drodze można podziwiać widoki nadwiślańskich miejscowości.',
          en: 'A historic palace and park complex with elegant architecture, greenery and peaceful walking alleys. It can be reached directly by regional PKS bus, with views of Vistula-side villages along the way.',
        },
        distance: { pl: 'ok. 11 km', en: 'approx. 11 km' },
      },
      {
        id: 'dabrowa-chelminska',
        icon: 'landmark',
        title: { pl: 'Dąbrowa Chełmińska', en: 'Dabrowa Chelminska' },
        description: {
          pl: 'Gmina i lokalny punkt odniesienia dla pobytu w Czarżu. To wygodna okolica na nocleg blisko Bydgoszczy, z szybkim dojazdem do atrakcji Doliny Dolnej Wisły.',
          en: 'A nearby municipality and local reference point for stays in Czarze, with convenient access to Bydgoszcz and the Lower Vistula Valley.',
        },
        distance: { pl: 'gmina obiektu', en: 'local municipality' },
      },
      {
        id: 'chelmno',
        icon: 'landmark',
        title: { pl: 'Chełmno', en: 'Chelmno' },
        description: {
          pl: 'Miasto zakochanych z zabytkową starówką, gotyckimi kościołami i klimatycznymi uliczkami nad Wisłą. Do Chełmna można dojechać bezpośrednio PKS-em, mijając po drodze malownicze nadwiślańskie miejscowości.',
          en: 'The city of lovers, known for its historic old town, Gothic churches and atmospheric streets near the Vistula River. Chelmno can be reached directly by regional PKS bus, passing scenic Vistula-side villages on the way.',
        },
        distance: { pl: 'krótki dojazd', en: 'short drive' },
      },
      {
        id: 'bydgoszcz',
        icon: 'landmark',
        title: { pl: 'Bydgoszcz', en: 'Bydgoszcz' },
        description: {
          pl: 'Miasto kanałów, Wyspy Młyńskiej, muzeów, spacerów nad Brdą i atrakcji dobrych na całodniową wycieczkę. Możliwy jest bezpośredni dojazd PKS-em, a trasa pozwala zobaczyć spokojne krajobrazy i nadwiślańskie miejscowości.',
          en: 'A city of canals, Mill Island, museums, riverside walks and attractions ideal for a day trip. It can be reached directly by regional PKS bus, with a route through calm landscapes and Vistula-side villages.',
        },
        distance: { pl: 'ok. 25 km', en: 'approx. 25 km' },
      },
      {
        id: 'torun',
        icon: 'landmark',
        title: { pl: 'Toruń', en: 'Torun' },
        description: {
          pl: 'Miasto Mikołaja Kopernika, słynnych pierników, gotyckiej starówki i wyjątkowego klimatu nad Wisłą.',
          en: 'The city of Nicolaus Copernicus, famous gingerbread, a Gothic old town and a unique Vistula-side atmosphere.',
        },
        distance: { pl: 'ok. 45 km', en: 'approx. 45 km' },
      },
    ],
    restaurants: [
      {
        id: 'bon-apetyt',
        title: { pl: 'Bon Apetyt', en: 'Bon Apetyt' },
        distance: { pl: '6 km od obiektu', en: '6 km from the property' },
        description: {
          pl: 'Lokalne miejsce z domowymi obiadami, przekąskami i cateringiem z dostawą pod wskazany adres. Dobre rozwiązanie, gdy chcecie zjeść spokojny posiłek na miejscu bez wychodzenia z obiektu.',
          en: 'A local spot offering homemade dinners, snacks and catering with delivery to your address. A convenient option when you want a relaxed meal at the property without going out.',
        },
      },
      {
        id: 'big-basza',
        title: { pl: 'Big Basza', en: 'Big Basza' },
        distance: { pl: '6 km od obiektu', en: '6 km from the property' },
        description: {
          pl: 'Szybka opcja na luźny wieczór: kebaby, pizza i dania na wynos z dostawą w okolice obiektu. Sprawdza się po dniu nad basenem albo po wycieczce.',
          en: 'A quick option for an easy evening: kebabs, pizza and takeaway-style meals delivered near the property. Useful after a day by the pool or a trip.',
        },
      },
      {
        id: 'restauracja-ostromecka',
        title: { pl: 'Restauracja Ostromecka', en: 'Ostromecka Restaurant' },
        distance: { pl: '11 km od obiektu', en: '11 km from the property' },
        description: {
          pl: 'Restauracja przy historycznym kompleksie pałacowo-parkowym w Ostromecku. Serwuje tradycyjną kuchnię polską w eleganckim wydaniu, szczególnie wartą rozważenia na spokojny obiad poza obiektem.',
          en: 'A restaurant by the historic palace and park complex in Ostromecko. It serves traditional Polish cuisine in an elegant style, a good choice for a calm lunch or dinner outside the property.',
        },
        details: [
          { pl: 'gęsina', en: 'goose' },
          { pl: 'jagnięcina', en: 'lamb' },
          { pl: 'cielęcina', en: 'veal' },
        ],
      },
    ],
    nearby: [
      {
        id: 'stan-mar',
        title: { pl: 'Stan-Mar Piekarnia i Cukiernia', en: 'Stan-Mar Bakery and Confectionery' },
        distance: { pl: '300 m od obiektu', en: '300 m from the property' },
        description: {
          pl: 'Piekarnia i cukiernia położona bardzo blisko obiektu. Dobre miejsce na świeże pieczywo, drożdżówki, ciasto do kawy i szybkie zakupy śniadaniowe bez planowania dłuższego wyjazdu.',
          en: 'A bakery and confectionery located very close to the property. A convenient place for fresh bread, pastries, cake for coffee and quick breakfast shopping without planning a longer trip.',
        },
        details: [
          { pl: 'świeże pieczywo', en: 'fresh bread' },
          { pl: 'słodkości', en: 'sweets' },
          { pl: 'czynna codziennie', en: 'open daily' },
        ],
      },
      {
        id: 'dino',
        title: { pl: 'Dino', en: 'Dino' },
        distance: { pl: '300 m od obiektu', en: '300 m from the property' },
        description: {
          pl: 'Supermarket w odległości krótkiego spaceru od domu. Przydatny na codzienne zakupy, napoje, produkty na grilla, kosmetyki i rzeczy potrzebne w trakcie pobytu.',
          en: 'A supermarket within a short walk from the house. Useful for everyday shopping, drinks, barbecue supplies, toiletries and essentials needed during your stay.',
        },
        details: [
          { pl: 'krótki spacer', en: 'short walk' },
          { pl: 'produkty na grilla', en: 'barbecue supplies' },
          { pl: 'codzienne zakupy', en: 'everyday shopping' },
        ],
      },
    ],
    busRoutes: [
      {
        id: 'bus-local',
        title: { pl: 'Autobus gminny w Czarżu', en: 'Municipal bus in Czarze' },
        distance: { pl: 'przystanek Czarże, Chełmińska 18/47', en: 'Czarze, Chelminska 18/47 stop' },
        description: {
          pl: 'Najbliższy przystanek znajduje się przy ul. Chełmińskiej, kilka minut spacerem od domu. Przed wyjazdem warto sprawdzić aktualne godziny w rozkładzie online.',
          en: 'The nearest stop is on Chelminska Street, a few minutes on foot from the house. Please check the current timetable online before travelling.',
        },
        details: [
          { pl: 'autobus gminny', en: 'municipal bus' },
          { pl: 'blisko obiektu', en: 'close to the property' },
          { pl: 'rozkład online', en: 'online timetable' },
        ],
        link: {
          label: { pl: 'Sprawdź rozkład jazdy', en: 'Check the timetable' },
          href: 'https://www.pks.bydgoszcz.pl/tabliczki-przystankowe?przystanek=073164_01&nazwa=CZAR%C5%BBE%2C+CHE%C5%81MI%C5%83SKA+18%2F47',
        },
      },
      {
        id: 'bus-bydgoszcz',
        title: { pl: 'Dojazd z Bydgoszczy', en: 'From Bydgoszcz' },
        distance: { pl: 'kursy w kierunku Czarża', en: 'routes towards Czarze' },
        description: {
          pl: 'Najwygodniej ruszyć z dworca autobusowego w Bydgoszczy i wybrać kurs w stronę Czarża lub Chełmna. Przystanek w Czarżu jest blisko obiektu.',
          en: 'The easiest option is to start from the bus station in Bydgoszcz and choose a route towards Czarze or Chelmno. The stop in Czarze is close to the property.',
        },
        details: [
          { pl: 'z Bydgoszczy', en: 'from Bydgoszcz' },
          { pl: 'PKS / autobus gminny', en: 'PKS / municipal bus' },
          { pl: 'sprawdź aktualny rozkład', en: 'check current timetable' },
        ],
      },
      {
        id: 'bus-chelmno',
        title: { pl: 'Dojazd z Chełmna', en: 'From Chelmno' },
        distance: { pl: 'krótki dojazd do Czarża', en: 'short ride to Czarze' },
        description: {
          pl: 'Z Chełmna do Czarża można dojechać autobusem regionalnym lub PKS-em. To dobre rozwiązanie dla gości bez auta i osób planujących krótki wypad do Chełmna.',
          en: 'From Chelmno, guests can reach Czarze by regional bus or PKS service. It is a good option without a car and for a short visit to Chelmno.',
        },
        details: [
          { pl: 'z Chełmna', en: 'from Chelmno' },
          { pl: 'krótki przejazd', en: 'short ride' },
          { pl: 'dobry wybór bez auta', en: 'good without a car' },
        ],
      },
    ],
    airports: [
      {
        id: 'airport-bydgoszcz',
        title: { pl: 'Port Lotniczy Bydgoszcz', en: 'Bydgoszcz Airport' },
        distance: { pl: 'ok. 35 km od obiektu', en: 'approx. 35 km from the property' },
        description: {
          pl: 'Najbliższe lotnisko dla gości Gerka Pool House. To najwygodniejszy wybór przy podróży z przesiadką lub połączeniach krajowych. Do obiektu najlepiej dojechać samochodem, taksówką albo wcześniej zamówionym transportem.',
          en: 'The closest airport for Gerka Pool House guests. It is the most convenient choice for connecting or domestic routes. The property is best reached by car, taxi or pre-arranged transport.',
        },
      },
      {
        id: 'airport-gdansk',
        title: { pl: 'Port Lotniczy Gdańsk im. Lecha Wałęsy', en: 'Gdansk Lech Walesa Airport' },
        distance: { pl: 'ok. 170 km od obiektu', en: 'approx. 170 km from the property' },
        description: {
          pl: 'Duże lotnisko międzynarodowe z szeroką siatką połączeń europejskich. Dobre rozwiązanie dla gości przylatujących z zagranicy, którzy planują dalszy dojazd samochodem przez Pomorze i Dolinę Dolnej Wisły.',
          en: 'A large international airport with a broad network of European connections. A good option for guests arriving from abroad and continuing by car through Pomerania and the Lower Vistula Valley.',
        },
      },
      {
        id: 'airport-poznan',
        title: { pl: 'Port Lotniczy Poznań-Ławica', en: 'Poznan-Lawica Airport' },
        distance: { pl: 'ok. 180 km od obiektu', en: 'approx. 180 km from the property' },
        description: {
          pl: 'Wygodna alternatywa dla gości lecących z zachodniej Polski lub z wybranych kierunków europejskich. Dojazd do obiektu prowadzi spokojną trasą przez Wielkopolskę i Kujawy.',
          en: 'A convenient alternative for guests flying from western Poland or selected European routes. The drive to the property leads through Greater Poland and Kuyavia.',
        },
      },
      {
        id: 'airport-warsaw-modlin',
        title: { pl: 'Lotnisko Warszawa-Modlin', en: 'Warsaw Modlin Airport' },
        distance: { pl: 'ok. 240 km od obiektu', en: 'approx. 240 km from the property' },
        description: {
          pl: 'Lotnisko obsługujące wiele połączeń niskokosztowych. Może być dobrym wyborem dla gości, którzy przylatują do Warszawy i planują dalszy przejazd samochodem w stronę Kujaw.',
          en: 'An airport serving many low-cost connections. It can be a good choice for guests arriving in Warsaw and continuing by car towards Kuyavia.',
        },
      },
      {
        id: 'airport-warsaw-chopin',
        title: { pl: 'Lotnisko Chopina w Warszawie', en: 'Warsaw Chopin Airport' },
        distance: { pl: 'ok. 280 km od obiektu', en: 'approx. 280 km from the property' },
        description: {
          pl: 'Największe lotnisko w Polsce, z dużą liczbą połączeń międzynarodowych i krajowych. To dobra opcja dla gości podróżujących z dalszych kierunków i planujących dojazd autem do Gerka Pool House.',
          en: 'Poland’s largest airport, with many international and domestic connections. A good option for guests travelling from farther destinations and planning to drive to Gerka Pool House.',
        },
      },
    ],
    bikeRoutes: {
      title: { pl: 'Trasy rowerowe', en: 'Cycling routes' },
      lead: {
        pl: 'Przez Czarże przebiega Wiślana Trasa Rowerowa (WTR), jeden z najdłuższych i najbardziej malowniczych szlaków rowerowych w Polsce. Okolica dobrze sprawdza się zarówno na krótką rekreacyjną przejażdżkę, jak i dłuższą trasę przez Dolinę Dolnej Wisły, w pobliżu wałów przeciwpowodziowych, pól, lasów i punktów widokowych.',
        en: 'The Vistula Cycling Route (WTR), one of the longest and most scenic cycling trails in Poland, runs through Czarze. The area works well for both a short recreational ride and a longer route through the Lower Vistula Valley, close to flood embankments, fields, forests and viewpoints.',
      },
      routes: [
        { pl: 'Wiślana Trasa Rowerowa (WTR)', en: 'Vistula Cycling Route (WTR)' },
        { pl: 'Zielony szlak „Dookoła Doliny Dolnej Wisły”', en: 'Green trail “Around the Lower Vistula Valley”' },
        { pl: 'Czarny szlak „Po Dolinie Dolnej Wisły”', en: 'Black trail “Through the Lower Vistula Valley”' },
      ],
    },
  },
  pricing: {
    room1Nightly: 1000,
    room2Nightly: 300,
    room2Enabled: false,
    room1Capacity: 6,
    maxGuests: 14,
    minStayNights: 1,
    currency: 'PLN',
    discounts: [],
    extraInfo: {
      pl: 'Cena weekendowa wynosi 1000 zł za noc: z piątku na sobotę, z soboty na niedzielę oraz z niedzieli na poniedziałek. Doba hotelowa trwa od 15:00, wymeldowanie do 12:00. Kwota wymaga potwierdzenia przez właściciela po sprawdzeniu dostępności terminu.',
      en: 'The weekend rate is 1000 PLN per night: Friday to Saturday, Saturday to Sunday and Sunday to Monday. Check-in starts at 15:00 and check-out is by 12:00. The amount requires confirmation by the owner after checking availability.',
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
        pl: 'Aktualnie rezerwowany apartament na parterze jest przeznaczony dla maksymalnie 6 osób.',
        en: 'The currently available ground-floor apartment is designed for up to 6 guests.',
      },
    },
    {
      id: 'pets',
      question: {
        pl: 'Czy obiekt przyjmuje zwierzęta?',
        en: 'Are pets allowed?',
      },
      answer: {
        pl: 'Ze względu na komfort i bezpieczeństwo wszystkich naszych gości, w tym osób z alergiami, obiekt nie przyjmuje zwierząt.',
        en: 'For the comfort and safety of all guests, including people with allergies, pets are not allowed on the property.',
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
        pl: 'W weekendy obowiązuje stała cena 1000 zł za noc: z piątku na sobotę, z soboty na niedzielę oraz z niedzieli na poniedziałek. Od poniedziałku do czwartku może obowiązywać niższa cena promocyjna zgodnie z warunkami w cenniku.',
        en: 'On weekends, a fixed rate of 1000 PLN per night applies: Friday to Saturday, Saturday to Sunday and Sunday to Monday. From Monday to Thursday, a lower promotional rate may apply according to the pricing terms.',
      },
    },
    {
      id: 'hotel-day',
      question: {
        pl: 'Jaka jest doba hotelowa?',
        en: 'What are the check-in and check-out times?',
      },
      answer: {
        pl: 'Zameldowanie jest możliwe od 15:00, a wymeldowanie do 12:00.',
        en: 'Check-in is available from 15:00 and check-out is by 12:00.',
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
      pl: 'Wybierz daty pobytu i liczbę gości, aby sprawdzić dostępność oraz koszt apartamentu za wybrane noce.',
      en: 'Choose your stay dates and guest count to check availability and the apartment price for the selected nights.',
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
    secondaryPhone: '',
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
        pl: 'Nocleg Bydgoszcz i okolice | Gerka Pool House Czarże',
        en: 'Accommodation near Bydgoszcz | Gerka Pool House Czarze',
      },
      description: {
        pl: 'Gerka Pool House w Czarżu to prywatny nocleg niedaleko Bydgoszczy, Chełmna i Dąbrowy Chełmińskiej, z basenem, ogrodem, grillem i parkingiem.',
        en: 'Gerka Pool House in Czarze is private accommodation near Bydgoszcz, Chelmno and Dabrowa Chelminska, with a pool, garden, barbecue and parking.',
      },
      canonicalPath: '/',
      ogImage: socialPreviewImage,
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
      ogImage: socialPreviewImage,
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
      ogImage: socialPreviewImage,
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
      ogImage: socialPreviewImage,
    },
  },
  updatedAt: new Date().toISOString(),
}
