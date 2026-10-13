# Dynamiczne ceny i godziny

W zakladce Cennik ustaw ceny parteru, pietra i obu apartamentow, godziny
zameldowania i wymeldowania oraz stawki oferty w tygodniu. Po zapisie
publiczna strona korzysta z tych ustawien w cenniku, rezerwacji, opisach,
FAQ i danych SEO. Historyczne rezerwacje zachowuja cene z chwili zapisu.

Opisy przechowywane w panelu zawieraja zmienne, np.:

- `{{priceGround}}`, `{{priceUpper}}`, `{{priceBoth}}` (kwota z waluta)
- `{{checkInTime}}`, `{{checkOutTime}}`
- `{{capacityGround}}`, `{{capacityUpper}}`, `{{maxGuests}}`
- `{{minStayNights}}`
- `{{weeksaveBasePrice}}`, `{{weeksaveExtraPrice}}`

Przyklad: `Wymeldowanie do {{checkOutTime}}. Parter: {{priceGround}} za dobe.`
Zmienne sa rozwiazywane osobno dla polskiej i angielskiej wersji strony.
Zapis tresci nie zastepuje ich aktualnymi wartosciami, dlatego kolejne
zmiany ustawien dalej aktualizuja wszystkie powiazane opisy.

Liczba wpisana recznie jako zwykly tekst nie jest powiazana z ustawieniem.
W nowych opisach nalezy uzywac zmiennych. Migracja wersji 26 zamienia
starsze standardowe wzmianki o cenach i godzinach na odpowiednie zmienne.

Zapis powiadamia inne karty w tej samej przegladarce. Na innych urzadzeniach
strona ponownie pobiera ustawienia po powrocie do karty oraz co minute.
Statyczny HTML nie publikuje godzin; aktualne dane SEO sa tworzone z ustawien
po uruchomieniu aplikacji.

Weryfikacja: `npm run check` uruchamia testy obejmujace renderowanie cennika,
FAQ, schematu SEO, wycene promocji i odswiezanie po zapisie ustawien.
