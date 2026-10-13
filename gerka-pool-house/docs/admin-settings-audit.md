# Audyt ustawien panelu administratora

Sprawdzono przeplyw danych z panelu, zapis ustawien, publiczne komponenty,
generowane HTML, dane SEO oraz ustawienia odbiorcy maili.

| Obszar | Sprawdzono / poprawiono |
| --- | --- |
| Nazwa i skrot logo | Skrot logo jest wyswietlany po zmianie. Nazwa trafia do naglowka, stopki, stron prawnych, podpisu mapy, opisow i SEO. |
| Opisy | Usunieto automatyczne nadpisywanie wszystkich liczb gosci w opisach. Zmienne nadal pobieraja ustawienia, a wlasne teksty sa zachowane. |
| Zdjecia | Desktop, mobile, okolica i galeria korzystaja z zapisanych adresow. Opcja uzycia desktopowego zdjecia na mobile pozostaje powiazana po kolejnych zmianach. Poprawione zdjecie odzyskuje widocznosc po bledzie poprzedniego adresu. |
| Kontakt i mapa | Telefony, email, adres i social media sa pobierane z ustawien. Akceptowane sa oba standardowe formaty Google Maps embed. |
| Okolica | Miejsca, restauracje, sklepy, autobusy, lotniska i trasy sa pobierane z panelu. Naprawiono pomijany link do rozkladu jazdy. |
| Ceny i godziny | Wspolne ustawienia dla cennika, opisow, FAQ, kalkulatora i SEO; stawka obu apartamentow jest osobna. |
| Pojemnosc i minimum pobytu | Weryfikowane przy zapisie oraz wycenie. Dodano edycje pojemnosci parteru; pojemnosc pietra wynika z limitu lacznego. |
| Rabaty | Procent, daty i dni tygodnia dzialaja dla kazdego kodu. Kod o nazwie WEEKSAVE nie omija juz ustawien administratora. Automatyczna oferta tygodniowa jest osobnym mechanizmem ze stawkami z panelu. |
| Rezerwacje i blokady | Przypisanie do apartamentow jest zapisywane; reczne blokady i zaakceptowane rezerwacje respektuja to przypisanie. |
| SEO | Tytuly, opisy, obraz podgladu, canonical i dane strukturalne korzystaja z ustawien. Naprawiono alternatywne adresy jezykowe dla absolutnych canonical i adresow z parametrami. |
| Odbiorca maili | Serwer z Supabase pobiera adres z zaufanego zapisu panelu. Stala zmienna srodowiskowa jest tylko rezerwa dla instalacji bez Supabase. Nie wysylano prawdziwych wiadomosci w trakcie testow. |

Zapis zachowuje szablony, a publiczna strona rozwiazuje zmienne na osobnej kopii.
Starsze standardowe opisy migruja do wersji 27. Nazwa obiektu moze byc uzywana
w opisach jako `{{brandName}}`, a kontakt jako `{{contactEmail}}`,
`{{contactPhone}}`, `{{contactAddress}}` i `{{ownerEmail}}`.

Niezalezne opisy pozostaja osobnymi tresciami. Nowe liczby i dane kontaktowe
wpisane jako zwykly tekst nie sa automatycznie laczone z polem ustawien;
powiazane wzmianki nalezy wstawiac jako zmienne. Dotychczasowe rezerwacje
zachowuja historyczne ceny.

Walidacja: `npm run check` (TypeScript, ESLint, testy i build). Testy renderuja
publiczne sekcje w obu jezykach, sprawdzaja migracje i zapis, rabaty oraz
konfiguracje email z zamockowanym odczytem serwera. Audyt nie obejmowal
wdrozenia na produkcje, faktycznej wysylki maili ani przesylania plikow.
