/**
 * Default markdown for legal CMS pages (regulamin, privacy, cookies).
 * Admin “Przywróć domyślny” and seed*IfMissing use these strings.
 * Draft for lawyer review — not a substitute for legal advice.
 */

const EFFECTIVE_FROM = '15-10-2026';
const SITE_URL = 'https://szkolenia.glocksklep.pl';
const FIRM = 'Stay Frosty Piotr Krzoska';
const NIP = '8291724148';
const REGON = '367849550';
const EMAIL_PUBLIC = 'szkolenia@glocksklep.pl';
const EMAIL_ORDERS = 'zamowienia@glocksklep.pl';
const PHONE = '530 556 523';

export const DEFAULT_REGULAMIN_MD = `# Regulamin Serwisu GLOCKSKLEP Szkolenia

**Obowiązuje od:** ${EFFECTIVE_FROM}

## I. Postanowienia ogólne

1. Niniejszy regulamin (dalej „Regulamin”) określa zasady korzystania z serwisu internetowego GLOCKSKLEP Szkolenia dostępnego pod adresem ${SITE_URL} (dalej „Serwis”) oraz zasady zawierania i wykonywania umów o udział w szkoleniach strzeleckich oferowanych za pośrednictwem Serwisu.
2. Organizatorem Serwisu i stroną umów o udział w szkoleniach jest Piotr Krzoska, przedsiębiorca prowadzący działalność gospodarczą pod firmą ${FIRM}, wpisany do Centralnej Ewidencji i Informacji o Działalności Gospodarczej, NIP: ${NIP}, REGON: ${REGON} (dalej „Organizator”).
3. Kontakt z Organizatorem:
   - e-mail: ${EMAIL_PUBLIC} (sprawy ogólne) oraz ${EMAIL_ORDERS} (zapisy, płatności, reklamacje);
   - telefon: ${PHONE}.
4. Regulamin jest udostępniany nieodpłatnie w Serwisie w sposób umożliwiający jego pozyskanie, odtwarzanie i utrwalanie. Zawarcie umowy o udział w szkoleniu wymaga akceptacji Regulaminu.
5. W sprawach ochrony danych osobowych zastosowanie ma Polityka prywatności dostępna pod adresem ${SITE_URL}/polityka-prywatnosci. Informacje o plikach cookie — Polityka cookies: ${SITE_URL}/polityka-cookies.
6. Do umów zawieranych za pośrednictwem Serwisu stosuje się prawo polskie. Umowa zawierana jest w języku polskim.
7. Żadne z postanowień Regulaminu nie wyłącza ani nie ogranicza uprawnień konsumenta ani przedsiębiorcy, o którym mowa w art. 7aa ustawy z dnia 30 maja 2014 r. o prawach konsumenta (dalej „Przedsiębiorca Uprzywilejowany”), wynikających z przepisów bezwzględnie obowiązujących.

## II. Definicje

Użyte w Regulaminie pojęcia oznaczają:

- **Serwis** — strona internetowa ${SITE_URL} wraz z funkcjami Konta, zapisów na szkolenia, listy oczekujących i dokumentów pro forma.
- **Konto** — indywidualne konto użytkownika w Serwisie, powiązane z adresem e-mail.
- **Użytkownik** — osoba korzystająca z Serwisu, w tym posiadacz Konta.
- **Szkolenie** — usługa szkolenia strzeleckiego prezentowana w Serwisie (opis, cena, wymagania).
- **Termin** — konkretna data (oraz ewentualnie miejsce i godziny) realizacji Szkolenia, na którą możliwy jest zapis.
- **Uczestnik** — Użytkownik zapisany na dany Termin.
- **Proforma** — dokument zawierający dane do przelewu i kwotę należności za udział w Terminie, generowany w Serwisie po zapisie.
- **Konsument** — osoba fizyczna zawierająca z Organizatorem umowę niezwiązaną bezpośrednio z jej działalnością gospodarczą lub zawodową.

## III. Wymagania techniczne i wiek

1. Korzystanie z Serwisu wymaga urządzenia z aktualną przeglądarką internetową, dostępu do Internetu oraz aktywnego adresu e-mail. Do pełnego korzystania z zapisów wymagane jest Konto.
2. Serwis i szkolenia są skierowane do osób, które ukończyły **18 lat**. Zakładając Konto oraz zapisując się na Termin, Użytkownik oświadcza, że ma co najmniej 18 lat.

## IV. Konto użytkownika

1. Konto można utworzyć poprzez rejestrację adresu e-mail (z potwierdzeniem / ustawieniem hasła według procedury w Serwisie), logowanie kontem Google albo link e-mail (magic link), o ile funkcja jest udostępniona.
2. Użytkownik zobowiązuje się podawać dane prawdziwe i aktualne (w szczególności imię i nazwisko lub nazwę wyświetlaną, e-mail, numer telefonu) oraz chronić dane dostępowe do Konta.
3. Przy rejestracji e-mail wymagana jest akceptacja niniejszego Regulaminu oraz Polityki prywatności. Korzystanie z Konta w zakresie zapisów na Terminy oznacza akceptację aktualnego Regulaminu.
4. Organizator może zawiesić lub usunąć Konto w przypadku naruszenia Regulaminu, podania nieprawdziwych danych lub działań zagrażających bezpieczeństwu Serwisu lub innych Użytkowników, zawiadamiając Użytkownika na adres e-mail powiązany z Kontem, o ile jest to możliwe.

## V. Zapis na Termin i lista oczekujących

1. Informacje o Szkoleniach i Terminach w Serwisie stanowią zaproszenie do zawarcia umowy w rozumieniu art. 71 Kodeksu cywilnego, na warunkach Regulaminu.
2. Zapis na Termin wymaga zalogowanego Konta oraz potwierdzenia zapisu w Serwisie. Zapis realizowany jest poprzez system Serwisu (w tym endpoint zapisu po stronie Organizatora).
3. Do zawarcia umowy o udział w danym Terminie dochodzi z chwilą skutecznego zapisu Użytkownika na Termin (potwierdzenie w Serwisie oraz — w miarę możliwości — wiadomość e-mail z potwierdzeniem).
4. Liczba miejsc na Terminie jest ograniczona. W przypadku braku wolnych miejsc Użytkownik może zapisać się na **listę oczekujących** (Konto: dane z profilu; gość: co najmniej adres e-mail). Lista oczekujących nie gwarantuje miejsca; Organizator może poinformować o zwolnieniu miejsca według własnej procedury.
5. Organizator może odmówić zapisu lub anulować udział Uczestnika, jeżeli Termin został odwołany, dane Użytkownika są nieprawidłowe albo Użytkownik nie spełnia wymogów uczestnictwa opisanych w Regulaminie lub na stronie Szkolenia — z odpowiednim rozliczeniem wpłat według sekcji VIII.

## VI. Ceny i płatności

1. Ceny Szkolenia w systemie Serwisu są podawane w złotych polskich (PLN) jako kwoty **netto**. Podatek VAT wynosi zasadniczo **23%**, o ile przepisy lub oznaczenie przy danym Terminie nie stanowią inaczej. Przełącznik netto/brutto w interfejsie służy wyłącznie prezentacji i nie zmienia podstawy rozliczenia.
2. Po zapisie Uczestnik otrzymuje dostęp do **Proformy** z danymi do przelewu w sekcji „Moje szkolenia” (oraz ewentualnie w wiadomości e-mail).
3. Akceptowane metody płatności: **przelew bankowy** na rachunek wskazany w Proformie oraz — za uzgodnieniem z Organizatorem — **gotówka** (oznaczenie w systemie przez Organizatora).
4. Serwis **nie** obsługuje bramek płatności online (np. BLIK, karty, Przelewy24).
5. Termin zapłaty wynika z Proformy i wynosi zasadniczo **do 3 dni przed** datą Terminu (data Terminu minus 3 dni), chyba że Organizator wskaże inaczej. Brak wpłaty w terminie może skutkować skreśleniem z listy Uczestników bez obowiązku świadczenia usługi, z zastrzeżeniem sekcji VIII w zakresie już dokonanych wpłat.
6. Na życzenie Uczestnika (w tym po podaniu NIP w profilu) Organizator może wystawić fakturę zgodnie z obowiązującymi przepisami.

## VII. Wymogi uczestnictwa w szkoleniu strzeleckim

1. Udział w szkoleniu strzeleckim może wymagać posiadania **pozwolenia na broń** oraz **własnej broni** (lub innego sprzętu wskazanego w opisie Szkolenia / FAQ), o ile Organizator nie przewidzi inaczej dla danego Terminu (np. broń firmowa dla uprawnionych służb).
2. Serwis **nie weryfikuje technicznie** pozwolenia ani sprzętu przy zapisie. Spełnienie wymogów jest obowiązkiem Uczestnika. Organizator lub instruktor może odmówić dopuszczenia do zajęć osobie niespełniającej wymogów bezpieczeństwa lub wymogów opisanych dla Szkolenia — bez obowiązku zwrotu w zakresie, w jakim odmowa wynika z winy lub zaniechania Uczestnika, z zastrzeżeniem bezwzględnie obowiązujących przepisów.
3. Uczestnik zobowiązuje się przestrzegać zasad bezpieczeństwa na strzelnicy oraz poleceń instruktora.

## VIII. Rezygnacja, odwołanie Terminu i zwroty

1. Uczestnik może wypisać się z Terminu w Serwisie (funkcja wypisu) w dowolnym momencie przed rozpoczęciem Terminu, o ile funkcja jest dostępna.
2. **Zwrot wpłaty:**
   - przy rezygnacji Uczestnika złożonej **co najmniej 3 dni przed** datą Terminu — zwrot **100%** wpłaconej kwoty;
   - przy rezygnacji **później niż 3 dni przed** datą Terminu (tj. w okresie krótszym niż 3 pełne dni przed datą Terminu) — **brak zwrotu** wpłaconej kwoty;
   - przy **odwołaniu Terminu przez Organizatora** — zwrot **100%** wpłaconej kwoty albo — za zgodą Uczestnika — przeniesienie zapisu na inny Termin.
3. Zwrot dokonywany jest przelewem na rachunek, z którego dokonano płatności, lub inny wskazany przez Uczestnika, w rozsądnym terminie (co do zasady do 14 dni od skutecznego ustalenia podstawy zwrotu).
4. Wypis z Terminu w Serwisie nie jest tożsamy z automatycznym zwrotem — Uczestnik powinien skontaktować się w sprawie zwrotu na ${EMAIL_ORDERS}, podając dane umożliwiające identyfikację zapisu i płatności.

## IX. Prawo odstąpienia od umowy zawartej na odległość

1. Zgodnie z art. 38 pkt 12 ustawy o prawach konsumenta, prawo odstąpienia od umowy zawartej na odległość **nie przysługuje** w odniesieniu do umów o świadczenie usług w zakresie zakwaterowania, innych niż do celów mieszkalnych, przewozu rzeczy, najmu samochodów, gastronomii, usług związanych z wypoczynkiem, wydarzeniami rozrywkowymi, sportowymi lub kulturalnymi, **jeżeli w umowie oznaczono dzień lub okres świadczenia usługi**.
2. Umowa o udział w Terminie szkolenia strzeleckiego w oznaczonym dniu stanowi umowę, do której stosuje się powyższy wyjątek. Niezależnie od tego, zasady rezygnacji i zwrotów określa sekcja VIII.
3. Postanowienia dotyczące Konsumenta stosuje się odpowiednio do Przedsiębiorcy Uprzywilejowanego w zakresie przewidzianym ustawą o prawach konsumenta.

## X. Reklamacje

1. Reklamacje dotyczące Serwisu lub wykonania umowy o udział w szkoleniu można składać na adres ${EMAIL_ORDERS}.
2. Reklamacja powinna zawierać dane kontaktowe zgłaszającego, opis problemu oraz żądanie.
3. Organizator rozpatruje reklamację w terminie 14 dni od jej otrzymania i odpowiada na adres e-mail wskazany w zgłoszeniu.
4. Konsument i Przedsiębiorca Uprzywilejowany mogą skorzystać z pozasądowych sposobów rozpatrywania sporów, w tym z informacji na stronie UOKiK: https://polubowne.uokik.gov.pl/ oraz platformy ODR.

## XI. Postanowienia końcowe

1. Organizator może zmieniać Regulamin. Nowa wersja obowiązuje od daty publikacji w Serwisie i stosuje się do zapisów dokonanych po tej dacie, o ile przepisy bezwzględnie obowiązujące nie stanowią inaczej.
2. W sprawach nieuregulowanych zastosowanie mają przepisy Kodeksu cywilnego, ustawy o prawach konsumenta, ustawy o świadczeniu usług drogą elektroniczną oraz inne właściwe przepisy prawa polskiego.
3. Regulamin obowiązuje od dnia ${EFFECTIVE_FROM} r.
`;

export const DEFAULT_PRIVACY_POLICY_MD = `# Polityka prywatności

**Obowiązuje od:** ${EFFECTIVE_FROM}

## 1. Informacje ogólne

1. Niniejsza Polityka prywatności określa zasady przetwarzania danych osobowych w związku z korzystaniem z serwisu GLOCKSKLEP Szkolenia dostępnego pod adresem ${SITE_URL} (dalej „Serwis”), w tym rejestracją Konta, zapisami na szkolenia, listą oczekujących oraz kontaktami z Organizatorem.
2. Polityka stanowi wykonanie obowiązku informacyjnego wynikającego z art. 13 i 14 rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO) oraz uwzględnia ustawę z dnia 10 maja 2018 r. o ochronie danych osobowych.
3. Szczegółowe informacje o plikach cookie i podobnych technologiach znajdują się w Polityce cookies (${SITE_URL}/polityka-cookies).

## 2. Administrator danych

1. Administratorem danych osobowych jest Piotr Krzoska, przedsiębiorca prowadzący działalność gospodarczą pod firmą ${FIRM}, NIP: ${NIP}, REGON: ${REGON} (dalej „Administrator” lub „Organizator”).
2. Administrator nie wyznaczył Inspektora Ochrony Danych (IOD).
3. W sprawach dotyczących ochrony danych osobowych można kontaktować się:
   - e-mail: ${EMAIL_PUBLIC} lub ${EMAIL_ORDERS};
   - telefon: ${PHONE}.

## 3. Kategorie osób i źródło danych

1. Administrator przetwarza dane: użytkowników Konta, uczestników szkoleń, osób na liście oczekujących (w tym gości podających e-mail), osób kontaktujących się przez formularz lub e-mail oraz odwiedzających Serwis (w zakresie danych technicznych).
2. Dane pochodzą bezpośrednio od osoby, której dotyczą (formularze, Konto, zapis, waitlist, kontakt, wybór w banerze cookies) albo — w ograniczonym zakresie — z urządzeń i oprogramowania używanych do korzystania z Serwisu (dane techniczne / logi).
3. Serwis umożliwia zakup / zapis po utworzeniu Konta; lista oczekujących może być dostępna także dla gościa (e-mail).

## 4. Cele, zakres i podstawy prawne przetwarzania

Administrator przetwarza dane wyłącznie w zakresie niezbędnym do poniższych celów:

1. **Założenie i prowadzenie Konta, uwierzytelnianie (Firebase Authentication)** — art. 6 ust. 1 lit. b RODO. Zakres: adres e-mail, hasło (w formie obsługiwanej przez dostawcę Auth — Administrator nie przechowuje haseł w postaci jawnej), identyfikator użytkownika, imię i nazwisko / nazwa wyświetlana, numer telefonu, opcjonalnie NIP w profilu, dane logowania Google (jeśli wybrano tę metodę).
2. **Zawarcie i wykonanie umowy o udział w szkoleniu** (zapis na Termin, komunikacja, Proforma, potwierdzenia e-mail, status płatności / gotówki) — art. 6 ust. 1 lit. b RODO. Zakres: dane z Konta oraz dane uczestnika na Terminie (imię/nazwa, e-mail, telefon, status opłacenia).
3. **Lista oczekujących** — art. 6 ust. 1 lit. b RODO (gdy dotyczy zamiaru zawarcia umowy) lub lit. f RODO (prawnie uzasadniony interes: obsługa kolejki na zwolnione miejsca). Zakres: e-mail, opcjonalnie imię/nazwa i telefon, identyfikator kursu/Terminu.
4. **Wystawianie i przechowywanie dokumentów sprzedaży oraz obowiązki rachunkowe i podatkowe** — art. 6 ust. 1 lit. c RODO. Zakres: dane identyfikacyjne i transakcyjne (w tym NIP, jeśli podano).
5. **Reklamacje, roszczenia, obrona przed roszczeniami** — art. 6 ust. 1 lit. b oraz lit. f RODO.
6. **Obsługa zapytań i formularza kontaktowego** — art. 6 ust. 1 lit. f RODO (komunikacja) lub lit. b, jeśli kontakt dotyczy umowy.
7. **Bezpieczeństwo i ciągłość Serwisu** (hosting, logi, zapobieganie nadużyciom) — art. 6 ust. 1 lit. f RODO.
8. **Zapamiętanie wyboru dotyczącego cookies** (cookie \`cookiesConsent\`) — art. 6 ust. 1 lit. f RODO (respektowanie preferencji). Serwis **obecnie nie uruchamia** narzędzi analitycznych (np. Firebase Analytics) wymagających zgody; gdyby takie narzędzia zostały włączone, podstawą będzie art. 6 ust. 1 lit. a RODO po wyrażeniu zgody w banerze.

## 5. Dobrowolność podania danych

1. Podanie danych wymaganych przy rejestracji i zapisie jest warunkiem świadczenia tych usług. Ich niepodanie uniemożliwia założenie Konta lub zapis na Termin.
2. Podanie NIP jest dobrowolne i potrzebne, jeżeli Użytkownik chce fakturę z NIP.
3. Zapis gościa na listę oczekujących wymaga co najmniej adresu e-mail.
4. Wybór w banerze cookies jest dobrowolny; odrzucenie nie ogranicza przeglądania Serwisu ani zapisów (przy braku analityki efekt praktyczny dotyczy zapamiętania preferencji).

## 6. Odbiorcy danych

Dane mogą być ujawniane wyłącznie podmiotom przetwarzającym je na zlecenie Administratora lub gdy jest to niezbędne do umowy albo obowiązku prawnego, w szczególności:

- dostawcom usług chmurowych i infrastrukturalnych (w tym Google Cloud / Firebase — hosting, Authentication, Firestore, Cloud Functions);
- dostawcom usług poczty elektronicznej / SMTP (potwierdzenia zapisów, waitlist, komunikacja);
- podmiotom świadczącym usługi księgowe, prawne lub doradcze — w niezbędnym zakresie;
- organom państwowym lub sądowym — gdy obowiązek wynika z prawa.

Płatność odbywa się przelewem bankowym lub gotówką; Administrator nie korzysta z bramek płatności online, więc dane nie są przekazywane operatorom takich bramek. Serwis nie korzysta z kurierów / paczkomatów w procesie zapisu na szkolenie.

## 7. Przekazywanie danych poza EOG

1. Część usług technicznych (w szczególności Google / Firebase) może wiązać się z przetwarzaniem danych poza Europejskim Obszarem Gospodarczym, w tym w Stanach Zjednoczonych.
2. W takim przypadku Administrator stosuje zabezpieczenia wymagane przez RODO, w szczególności standardowe klauzule umowne zatwierdzone przez Komisję Europejską lub — o ile ma to zastosowanie — mechanizmy oparte na decyzji o odpowiednim stopniu ochrony (np. Data Privacy Framework wobec certyfikowanych podmiotów).
3. Informacje o stosowanych zabezpieczeniach można uzyskać, kontaktując się z Administratorem (pkt 2).

## 8. Okres przechowywania danych

Dane są przechowywane nie dłużej, niż jest to konieczne:

- dane Konta — przez czas istnienia Konta, a po usunięciu — przez okres przedawnienia roszczeń lub krócej, jeśli wcześniej ustała potrzeba;
- dane związane z umową o udział w szkoleniu — przez czas realizacji oraz okres przedawnienia roszczeń (co do zasady do 6 lat; dla roszczeń związanych z działalnością gospodarczą — często 3 lata, z zastrzeżeniem odmiennych przepisów);
- dokumentacja rachunkowa i podatkowa — co do zasady 5 lat od końca roku kalendarzowego, w którym upłynął termin płatności podatku / zamknięto rok obrotowy;
- dane z listy oczekujących — do czasu zapisu na Termin, usunięcia wpisu lub ustania celu;
- dane z korespondencji / formularza kontaktowego — przez czas obsługi sprawy i przedawnienia ewentualnych roszczeń;
- cookie \`cookiesConsent\` — do 150 dni lub do wcześniejszego usunięcia przez użytkownika;
- dane w localStorage / sessionStorage — do usunięcia przez użytkownika, wyczyszczenia pamięci przeglądarki lub zakończenia sesji.

## 9. Prawa osoby, której dane dotyczą

W zakresie wynikającym z RODO przysługują m.in.:

- prawo dostępu do danych (art. 15 RODO);
- prawo do sprostowania (art. 16 RODO);
- prawo do usunięcia (art. 17 RODO) — w przypadkach przewidzianych przepisami;
- prawo do ograniczenia przetwarzania (art. 18 RODO);
- prawo do przenoszenia danych (art. 20 RODO) — gdy przetwarzanie opiera się na umowie lub zgodzie i jest zautomatyzowane;
- prawo sprzeciwu wobec przetwarzania opartego na art. 6 ust. 1 lit. f RODO (art. 21 RODO);
- prawo do cofnięcia zgody, gdy przetwarzanie opiera się na art. 6 ust. 1 lit. a RODO — bez wpływu na zgodność z prawem przetwarzania przed cofnięciem.

Wniosek można złożyć e-mailem na ${EMAIL_ORDERS} lub ${EMAIL_PUBLIC}. Administrator odpowiada bez zbędnej zwłoki, nie później niż w terminie miesiąca (z możliwością przedłużenia zgodnie z art. 12 ust. 3 RODO).

## 10. Prawo wniesienia skargi do organu nadzorczego

Osobie, której dane dotyczą, przysługuje prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa, https://uodo.gov.pl — jeżeli uzna, że przetwarzanie narusza przepisy o ochronie danych.

## 11. Zautomatyzowane podejmowanie decyzji i profilowanie

Administrator nie podejmuje decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywołują skutki prawne lub w podobny sposób istotnie wpływają na osobę w rozumieniu art. 22 RODO. Serwis obecnie nie prowadzi analityki marketingowej opartej na zgodzie cookies.

## 12. Bezpieczeństwo danych

Administrator stosuje środki techniczne i organizacyjne odpowiednie do ryzyka, w tym szyfrowanie połączeń (HTTPS), ograniczenie dostępu administracyjnego oraz infrastrukturę dostawców chmurowych. Żadne przesyłanie danych przez Internet nie jest w pełni wolne od ryzyka — należy dbać o poufność urządzeń i skrzynek e-mail.

## 13. Osoby małoletnie

Serwis jest skierowany do osób pełnoletnich (co najmniej 18 lat). Administrator nie zbiera świadomie danych dzieci poniżej 16. roku życia w rozumieniu art. 8 RODO. W razie powzięcia informacji o takich danych, Administrator usunie je bez zbędnej zwłoki, o ile przepisy nie stanowią inaczej.

## 14. Zmiany Polityki prywatności

1. Administrator może aktualizować Politykę przy zmianie przepisów, funkcjonalności Serwisu lub praktyk przetwarzania.
2. Nowa wersja obowiązuje od daty publikacji w Serwisie („Obowiązuje od”), z zastrzeżeniem, że do umów zawartych wcześniej stosuje się zasady obowiązujące w chwili zawarcia, o ile przepisy bezwzględnie obowiązujące nie stanowią inaczej.
3. Zalecane jest okresowe zapoznawanie się z treścią Polityki.

## 15. Postanowienia końcowe

1. W sprawach nieuregulowanych zastosowanie mają przepisy RODO, ustawy o ochronie danych osobowych oraz — w zakresie korzystania z Serwisu — Regulamin.
2. Polityka prywatności obowiązuje od dnia ${EFFECTIVE_FROM} r.
`;

export const DEFAULT_COOKIES_POLICY_MD = `# Polityka cookies

**Obowiązuje od:** ${EFFECTIVE_FROM}

## 1. Informacje ogólne

1. Niniejsza Polityka cookies wyjaśnia, w jaki sposób serwis GLOCKSKLEP Szkolenia (${SITE_URL}, dalej „Serwis”) wykorzystuje pliki cookie oraz podobne technologie.
2. Polityka uzupełnia Politykę prywatności (${SITE_URL}/polityka-prywatnosci) i powinna być czytana łącznie z nią.
3. Administratorem Serwisu oraz — w zakresie, w jakim cookies wiążą się z danymi osobowymi — administratorem danych jest Piotr Krzoska, ${FIRM}, NIP: ${NIP}, REGON: ${REGON}. Kontakt: ${EMAIL_PUBLIC}, ${EMAIL_ORDERS}, tel. ${PHONE}.

## 2. Czym są pliki cookie i podobne technologie

1. Pliki cookie (ciasteczka) to niewielkie informacje tekstowe zapisywane na urządzeniu użytkownika przez przeglądarkę podczas odwiedzania strony. Cookies mogą być odczytywane przy kolejnych wizytach.
2. Serwis może także korzystać z technologii podobnych do cookies, w szczególności z **localStorage** oraz **sessionStorage**. Poniższe zasady stosuje się odpowiednio także do takich technologii, o ile służą one tym samym celom.

## 3. Podstawy prawne

1. Stosowanie cookies i podobnych technologii **niezbędnych** do świadczenia usługi drogą elektronicznej, której użytkownik wyraźnie żąda (w tym sesja logowania oraz zapamiętanie wyboru dotyczącego cookies), opiera się na przepisach o świadczeniu usług drogą elektroniczną / komunikacji elektronicznej oraz — w zakresie danych osobowych — na art. 6 ust. 1 lit. b lub lit. f RODO (wykonanie umowy / prawnie uzasadniony interes: działanie Serwisu i respektowanie preferencji).
2. Stosowanie cookies **analitycznych** wymagałoby uprzedniej zgody (art. 6 ust. 1 lit. a RODO). **Obecnie Serwis nie inicjuje Firebase Analytics ani innych narzędzi analitycznych** wymagających takiej zgody. Baner cookies służy do zapamiętania wyboru użytkownika i przygotowania Serwisu na ewentualne przyszłe włączenie analityki wyłącznie po akceptacji.

## 4. Rodzaje cookies i podobnych technologii w Serwisie

Serwis stosuje następujące kategorie:

1. **Niezbędne (sesja / uwierzytelnianie)** — pliki i mechanizmy Firebase Authentication utrzymujące sesję zalogowanego użytkownika. Bez nich logowanie i korzystanie z Konta nie jest możliwe w sposób trwały.
2. **Preferencje** — cookie \`cookiesConsent\`: zapisuje wybór w banerze („Spoko” = accepted albo „Odrzuć” = declined). Okres ważności: **150 dni**.
3. **Funkcjonalne (lokalne)**:
   - localStorage \`emailForSignIn\` — tymczasowo przechowuje e-mail przy logowaniu linkiem e-mail;
   - sessionStorage \`authReturnPath\` — zapamiętuje ścieżkę powrotu po logowaniu w ramach sesji przeglądarki.
   Dane te nie służą marketingowi ani zewnętrznej analityce.
4. **Analityczne** — **obecnie nieużywane**. W konfiguracji projektu może figurować identyfikator pomiaru Firebase, jednak Serwis nie wywołuje \`getAnalytics\` / nie loguje zdarzeń analitycznych. Gdyby analityka została włączona, uruchamiana byłaby wyłącznie po wyborze „Spoko”, a szczegóły zostałyby zaktualizowane w niniejszej Polityce.

## 5. Zarządzanie zgodą i baner

Przy pierwszej wizycie (oraz po wygaśnięciu lub usunięciu cookie zgody) Serwis wyświetla baner umożliwiający:

- akceptację — przycisk **„Spoko”**;
- odrzucenie — przycisk **„Odrzuć”**.

Wybór zapisywany jest w cookie \`cookiesConsent\`, aby nie pytać przy każdej wizycie.

## 6. Wycofanie zgody / zmiana wyboru

Zmiana wcześniej zapisanego wyboru jest możliwa w szczególności przez:

- usunięcie cookie \`cookiesConsent\` w ustawieniach przeglądarki, ponowne załadowanie strony i wybranie opcji w banerze;
- wyczyszczenie danych witryny / cookies dla domeny Serwisu;
- skonfigurowanie przeglądarki tak, aby blokowała cookies (może to wpłynąć na logowanie i inne funkcje Serwisu).

## 7. Okres przechowywania

- \`cookiesConsent\` — do 150 dni od zapisu albo do wcześniejszego usunięcia przez użytkownika;
- dane Firebase Auth (sesja) — zgodnie z mechanizmem sesji dostawcy / do wylogowania;
- \`emailForSignIn\` (localStorage) — do zakończenia procedury logowania linkiem lub usunięcia przez Serwis / użytkownika;
- \`authReturnPath\` (sessionStorage) — do zakończenia sesji przeglądarki lub odczytania i usunięcia przez Serwis.

## 8. Prawa użytkownika

W zakresie, w jakim cookies wiążą się z danymi osobowymi, użytkownikowi przysługują prawa opisane w Polityce prywatności, w tym prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, sprzeciwu, cofnięcia zgody oraz wniesienia skargi do Prezesa UODO (https://uodo.gov.pl).

## 9. Zmiany Polityki cookies

1. Administrator może aktualizować niniejszą Politykę, gdy zmieni się sposób korzystania z cookies, przepisy prawa lub funkcjonalność Serwisu.
2. Nowa wersja obowiązuje od daty publikacji w Serwisie („Obowiązuje od”).
3. Polityka cookies obowiązuje od dnia ${EFFECTIVE_FROM} r.
`;
