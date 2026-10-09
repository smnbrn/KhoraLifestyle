# Gestionale

Gestionale professionale per clienti, progetti, preventivi, fatture e finanze.
Vedi `docs/architettura-gestionale.md` per l'analisi
completa: schema database, decisioni architetturali e piano di sviluppo.

**Stato attuale: Fase 13 completata — tutte le 13 fasi pianificate sono
concluse.** Notifiche interne, error boundary, stati di caricamento, e una
revisione di sicurezza finale che ha trovato un bug reale (vedi sotto).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres + Auth + Storage) · TanStack Query/Table · React Hook Form +
Zod · Recharts

## Setup

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Crea un progetto su [supabase.com](https://supabase.com) (gratuito per
   iniziare).

3. Copia il file d'esempio e inserisci i tuoi valori (li trovi in
   *Project Settings → API* nella dashboard Supabase):

   ```bash
   cp .env.local.example .env.local
   ```

4. Avvia il server di sviluppo:

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000).

## Database (Fase 2)

Le migration in `supabase/migrations/` (9 file, applicate in ordine) creano
lo schema completo: tabelle, indici, viste (`project_financials`,
`client_financials`), trigger (ricalcolo totali, sync pagamenti → fatture,
generazione automatica delle transazioni dai pagamenti) e Row Level Security
su ogni tabella.

**Le ho testate per davvero** — non solo scritte: ho installato PostgreSQL
in locale, simulato lo schema `auth` di Supabase, ed eseguito un test
end-to-end con due utenti finti (calcolo automatico dei totali, pagamento
parziale poi a saldo, generazione automatica della transazione, blocco della
cancellazione di un cliente con progetti collegati, e soprattutto: verifica
che un utente non riesca in alcun modo a leggere o scrivere i dati di un
altro, usando un ruolo Postgres non-superuser realistico invece che il
superuser che avrebbe bypassato la RLS rendendo il test inutile).

Per collegare il database reale:

```bash
npx supabase login
npx supabase link --project-ref <tuo-project-id>
npx supabase db push          # applica le 9 migration al tuo progetto
```

Poi, per i dati di esempio: registra un utente (dall'app o dalla dashboard
Supabase), apri `supabase/seed.sql`, sostituisci il segnaposto con il suo
UUID ed eseguilo dal SQL Editor di Supabase Studio.

Infine rigenera i tipi reali (quelli in `types/database.types.ts` ora sono
scritti a mano rispecchiando lo schema testato, perché la generazione da
connessione diretta richiede Docker, non disponibile in questo ambiente):

```bash
npx supabase gen types typescript --project-id <tuo-project-id> > types/database.types.ts
```

Nota se mai modifichi questo file a mano: le versioni recenti di
`@supabase/postgrest-js` richiedono un campo `__InternalSupabase: {
PostgrestVersion: "..." }` in cima al tipo `Database`, altrimenti ogni query
risolve silenziosamente a `never` invece di dare un errore chiaro. Un dettaglio
non ovvio scoperto testando il build, non solo leggendo il codice. Stesso
discorso per le funzioni Postgres richiamate con `supabase.rpc(...)` (es.
`get_next_document_number` della Fase 8): vanno dichiarate a mano sotto
`Functions` con `Args`/`Returns`, altrimenti TypeScript non sa che esistono.
Con la CLI reale collegata a un progetto, entrambe le cose arrivano gratis.

## Autenticazione (Fase 3)

Login, registrazione e recupero password sono in `app/(auth)/`. Il layout
`app/(app)/layout.tsx` protegge tutto ciò che sta sotto (controllo server-side
reale, oltre al refresh di sessione "ottimistico" di `proxy.ts`).

**Passo da fare su Supabase perché il recupero password funzioni**: nella
dashboard Supabase, sotto *Authentication → Email Templates → Reset
Password*, il link deve avere questa forma (Supabase di default ne usa
un'altra, più vecchia, che non funziona con questo flusso):

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/recupera-password/aggiorna
```

Senza questa modifica al template, il link nell'email non porterà da nessuna
parte di utile.

## Dashboard (Fase 4)

Tutte le query sono in `services/dashboard.service.ts`. Nota su una scelta
tecnica: l'aggregazione "entrate/uscite per mese" avviene lato Next.js
(si prendono le transazioni del periodo e si raggruppano in TypeScript),
non con una `GROUP BY` SQL — PostgREST (l'API REST automatica di Supabase)
non espone aggregazioni su espressioni come `date_trunc` attraverso il query
builder. Per volumi molto alti di transazioni, in futuro si può sostituire
con una vista o funzione Postgres dedicata senza cambiare l'interfaccia del
resto dell'app.

## Clienti (Fase 5)

Prima sezione CRUD completa — il pattern qui (schema Zod, service layer,
Server Action con `ActionResult`, tabella guidata dall'URL per
ricerca/paginazione) si ripete identico per Progetti, Task, Preventivi e
Fatture nelle fasi successive.

Due dettagli utili se estendi questa sezione:
- **Eliminazione fisica bloccata**: se un cliente ha progetti/preventivi/
  fatture collegati, l'eliminazione fallisce per il vincolo `on delete
  restrict` della Fase 2 — l'azione lo intercetta e propone di archiviare
  invece. Comportamento voluto, non un bug.
- **Ricerca**: usa `ilike` su nome/referente/email con il termine "pulito"
  dai caratteri speciali di PostgREST (virgole e parentesi), non ancora
  l'indice full-text creato in Fase 2 — quello resta pronto per un
  miglioramento futuro (ricerca per rilevanza invece che per corrispondenza
  parziale).

## Progetti (Fase 6)

Stesso pattern di Clienti, con l'aggiunta di un selettore cliente (Select di
Radix collegato con `Controller` di react-hook-form, perché non è un input
nativo) e di un filtro per stato guidato dall'URL
(`components/shared/status-filter.tsx`, riutilizzabile per Task/Preventivi/
Fatture).

- **"Progresso"**: non era definito esplicitamente nel documento originale —
  l'ho interpretato come percentuale di task completati sul totale dei task
  del progetto. Se intendevate altro, è un singolo calcolo da cambiare in
  `app/(app)/progetti/[id]/progress-bar.tsx`.
- **Filtro per stato robusto ai parametri URL manomessi**: il valore di
  `?stato=` viene validato contro l'elenco di stati ammessi prima di essere
  usato nella query — altrimenti un URL modificato a mano avrebbe fatto
  fallire silenziosamente la tipizzazione. Vale lo stesso principio per i
  filtri per stato che arriveranno con Task/Preventivi/Fatture.

## Task & Calendario (Fase 7)

Task riusa lo stesso pattern delle fasi precedenti, con l'aggiunta di un
cambio-stato rapido inline nella tabella (`quick-status-select.tsx`, una
Server Action dedicata separata dal salvataggio completo) e un ordinamento
per priorità calcolato lato applicazione (Bassa/Media/Alta/Urgente non è
ordine alfabetico, quindi non basta un `order by` SQL).

Il calendario è **scritto a mano** con `date-fns` per la griglia mensile,
non una libreria di terzi — evita una dipendenza pesante e il rischio di
non poterla installare in ambienti con rete ristretta. Aggrega quattro
fonti diverse in una sola vista: scadenze task e fatture (calcolate al
volo, non duplicate), fine prevista progetti, ed eventi custom nella
tabella `events` — questi ultimi sono gli unici eliminabili dal calendario,
le scadenze derivate si gestiscono dalla loro sezione di origine.

## Preventivi (Fase 8)

Prima sezione con **righe voce dinamiche** (`useFieldArray` di react-hook-form)
e calcolo live di imponibile/IVA/totale mentre si scrive — lo stesso identico
calcolo che poi il trigger del database rifà lato server come fonte di
verità, quindi quello che vedi mentre compili corrisponde sempre a quello
che verrà salvato.

**Numerazione progressiva**: aggiunge una migration (`...000010`) con una
funzione Postgres `get_next_document_number` — un `INSERT ... ON CONFLICT
... DO UPDATE ... RETURNING`, l'unico modo per essere atomico e sicuro sotto
richieste concorrenti senza bisogno di `security definer` (gira già con i
permessi di chi chiama, protetto dalla RLS esistente su
`document_counters`). L'ho testata di nuovo contro Postgres locale:
incrementi consecutivi, contatori separati per tipo documento, reset
corretto a ogni nuovo anno.

**Creazione/modifica non del tutto atomica**: creare un preventivo è in
realtà due chiamate separate (riga preventivo, poi righe voce) perché
supabase-js non espone transazioni multi-istruzione lato client. Se la
seconda fallisce, la action cancella il preventivo appena creato per non
lasciare un numero "bruciato" a vuoto — non è una vera transazione
database, ma la conseguenza pratica è la stessa nella stragrande
maggioranza dei casi.

**Eliminazione**: qui permessa in qualunque stato (a differenza di
Clienti/Progetti non c'è integrità fiscale da proteggere per un
preventivo). Sarà diverso per le Fatture nella Fase 9.

Vedrai un warning innocuo di ESLint sul componente del form
(`react-hooks/incompatible-library`, sulla funzione `watch()` di
react-hook-form): il nuovo React Compiler segnala che non può
memoizzare quella funzione, ma è il comportamento corretto e voluto — è
proprio quello che fa aggiornare i totali in tempo reale. Nessuna azione
richiesta.

## Fatture e Pagamenti (Fase 9)

Stessa struttura dei Preventivi (righe dinamiche, calcolo live, numerazione
propria — contatore separato, quindi una fattura e un preventivo possono
avere lo stesso numero progressivo senza conflitti). Le differenze:

- **Pagamenti**: registrarli richiama solo `payments.insert(...)` — tutto il
  resto (ricalcolo di `paid_amount`/`remaining_amount`/`status`, generazione
  della transazione entrata) lo fanno i trigger già scritti e testati nella
  Fase 2. Nessuna logica duplicata qui.
- **"Scaduta" calcolata, non filtrabile a metà**: `effectiveStatus()` in
  `services/invoices.service.ts` calcola lo stato da mostrare confrontando
  `due_date` con oggi — usata per la UI. Per il *filtro* nella lista, invece,
  serve il confronto diretto sulla data dentro la query (non si può filtrare
  per un valore calcolato in TypeScript), gestito a parte in `listInvoices`.
- **Eliminazione vs annullamento**: qui applico davvero la regola descritta
  in Fase 2 — bozza si elimina, oltre quello stato si annulla soltanto
  (per non rompere la sequenza di numerazione). Per i Preventivi in Fase 8
  avevamo scelto diversamente (eliminabili sempre), perché lì non c'è lo
  stesso peso fiscale.
- Stesso identico warning ESLint innocuo su `watch()` già visto in Fase 8,
  qui in due file invece di uno.

Non ancora costruito: generare una fattura direttamente da un preventivo
accettato (userebbe `quote_id`, già in schema). Se vi serve prima della
Fase 12, ditemelo e lo aggiungo.

## Finanze e Commissioni (Fase 10)

**Scoperta importante testando questa fase**, non solo qui rilevante: le
relazioni FK di `transactions`, `commissions`, `documents` e `notes` verso
`clients`/`projects` (e per `documents` anche `quotes`/`invoices`) erano
dichiarate vuote (`Relationships: []`) in `types/database.types.ts` fin
dalla Fase 2 — non aveva dato problemi finché nessuna query aveva provato a
"includere" (embed) quei dati collegati. Provandolo per la prima volta qui
(`transactions(..., clients(name), projects(name))`), TypeScript ha
segnalato l'embed come impossibile. Ho corretto tutte e quattro le tabelle,
**compresi `documents` e `notes` che non erano ancora usati così** — sistemato
in anticipo prima che la Fase 11 (Documenti) ripetesse lo stesso errore.
Con la CLI reale collegata a un progetto questo non capiterebbe: la
generazione automatica include sempre tutte le relazioni.

Altre note:
- **Categorie**: create di default (le stesse elencate nella sezione 12)
  alla prima visita della pagina se l'utente non ne ha ancora, più la
  possibilità di aggiungerne al volo dal form movimento.
- **Commissioni pagate**: generano la transazione uscita collegata in due
  passaggi espliciti nel service (non un trigger dedicato come per i
  pagamenti fattura) — segnarla "da pagare" di nuovo elimina la transazione
  generata, per evitare uscite duplicate o fantasma.
- **Eliminare un movimento nato da un pagamento fattura è bloccato
  volutamente**: va tolto cancellando il pagamento dalla fattura
  corrispondente (Fase 9), altrimenti residuo e stato della fattura
  resterebbero disallineati.

## Documenti (Fase 11)

**Bucket privato**, mai pubblico: il download passa sempre da un URL
firmato con scadenza di 60 secondi (`createSignedUrl`), generato da una
Server Action — nessun link diretto e permanente al file. Percorso di
salvataggio `{user_id}/{uuid}-{nome file}`: il primo segmento è quello che
la RLS di `storage.objects` controlla per isolare i file di ogni utente,
esattamente come per le tabelle.

**Ho testato anche questa RLS**, non solo scritta: ho simulato un mock
minimale dello schema `storage` di Supabase (tabelle `buckets`/`objects` e
la funzione `storage.foldername`) contro Postgres locale, verificando che
un utente non veda né possa scrivere nella cartella di un altro. Stesso
principio dei test di Fase 2, adattato perché lo schema `storage` non
esiste in un Postgres vanilla.

**Nuovo tipo di errore del React Compiler scoperto qui**
(`react-hooks/static-components`, diverso da quello innocuo di
`watch()` già visto): calcolare "quale componente Lucide usare" in una
variabile durante il render (`const Icon = fileIcon(...)`) e poi scriverlo
come `<Icon />` viene segnalato come rischioso, anche se in questo caso
specifico era innocuo (l'icona scelta è sempre una delle stesse costanti
importate). Corretto estraendo un componente dedicato
(`components/shared/file-type-icon.tsx`) che decide internamente quale
icona disegnare — pattern da preferire anche nelle fasi successive ogni
volta che serve un'icona "dinamica" in base a un dato.

Upload/eliminazione sono operazioni **in due passaggi non atomici** (file su
Storage, poi riga su `documents`, con compensazione se il secondo fallisce)
— stesso principio già visto per preventivi/fatture in Fase 8-9, per lo
stesso motivo (supabase-js non espone transazioni multi-istruzione lato
client).

## Report (Fase 12)

Tutti i calcoli sono in `services/reports.service.ts`, parametrizzati da un
intervallo di date (`resolvePeriod()` in `lib/report-periods.ts` traduce i
6 periodi richiesti — compreso quello personalizzato — in date concrete;
testata a parte con una data odierna finta per verificare i confini di
mese/trimestre/anno). Filtri cliente/progetto/categoria sono cumulabili col
periodo, non alternativi.

Un paio di scelte d'interpretazione, segnalate perché non esplicitate nel
documento originale:
- **"Fatturato" vs "Entrate"**: sono due numeri diversi qui — fatturato
  somma il totale delle fatture emesse nel periodo (competenza), entrate
  somma i pagamenti/transazioni realmente incassati nel periodo (cassa).
  Possono differire quando una fattura emessa non è ancora stata pagata.
- **Redditività progetti nel periodo**: il "valore progetto" resta quello
  totale del progetto (non ha senso "affettarlo" per periodo), mentre i
  "costi" sono solo quelli con transazione nel periodo selezionato — quindi
  il profitto mostrato qui può differire da quello (sempre corretto, ma
  su tutta la vita del progetto) della pagina di dettaglio Progetto.

Il grafico riusa lo stesso componente `IncomeExpenseChart` della Dashboard
(stessa forma dei dati), invece di scriverne uno nuovo identico.

## Rifinitura finale (Fase 13)

**Il bug più importante di tutto il progetto è stato trovato qui**, all'ultima
revisione di sicurezza, non prima: `proxy.ts` (Fase 3) non includeva
`/auth/confirm` tra i percorsi pubblici. Conseguenza pratica: chiunque
cliccasse il link di recupero password (o di conferma email alla
registrazione, se attiva) veniva rediretto a `/login` **prima** che la route
riuscisse a verificare il token e stabilire la sessione — il recupero
password non avrebbe mai funzionato, in nessuna delle fasi precedenti,
nonostante la route stessa fosse sempre stata corretta. Corretto aggiungendo
`/auth/confirm` all'elenco. Un ripasso finale della sicurezza non è stato
un passaggio formale: ha trovato qualcosa che 10 fasi di sviluppo non
avevano notato.

Altre verifiche fatte in questa fase:
- **Ogni Server Action che scrive dati controlla l'utente autenticato**:
  verificato sistematicamente su tutti i file `actions.ts` del progetto (non
  a campione). Le uniche eccezioni sono login/registrazione/recupero
  password e logout, che per natura non possono o non devono richiedere
  una sessione già attiva.
- **Nessuna service role key, nessun segreto hardcoded**: cercati in tutto
  il codice applicativo, nessun risultato.
- **Ogni pagina di dettaglio e di modifica gestisce il record non
  trovato** (`notFound()`), incluso — per costruzione della RLS — il caso
  di un ID valido ma appartenente a un altro utente: entrambi i casi
  risultano in un 404 identico, senza far trapelare quale dei due sia
  accaduto.
- **Migration testate di nuovo tutte e 11 insieme** da un database vuoto,
  più un test end-to-end completo (cliente → progetto → fattura →
  pagamento → transazione automatica → vista finanziaria → documento) come
  ultima conferma che tutto funzioni ancora insieme dopo 13 fasi.

Aggiunto in questa fase:
- **Notifiche interne** (sezione 27): campanella nella topbar, calcolate a
  runtime da task/fatture/progetti in scadenza o scaduti nei prossimi 7
  giorni — mai persistite, stesso principio già scelto per lo stato
  "scaduta" e per il Calendario.
- **Error boundary**: `app/(app)/error.tsx` per errori imprevisti nella
  sezione autenticata, `app/global-error.tsx` come rete di sicurezza per il
  layout radice, `app/not-found.tsx` per pagine inesistenti — mai più uno
  schermo bianco o uno stack trace grezzo mostrato all'utente.
- **Stato di caricamento condiviso** (`app/(app)/loading.tsx`): Next.js lo
  mostra automaticamente durante la navigazione, invece di uno schermo
  bianco mentre i Server Component recuperano i dati.
- Un'icona semplice dell'app (`app/icon.svg`), al posto del favicon di
  default rimasto da Next.js.

Il warning innocuo di `watch()` di react-hook-form (React Compiler) compare
ora in tre file in tutto il progetto: `preventivi/quote-form.tsx`,
`fatture/invoice-form.tsx`, `finanze/transaction-form-dialog.tsx` — stesso
comportamento voluto ovunque, nessuna azione richiesta.

**Aggiornamento dopo il primo `npm run build` reale**: collegando un vero
progetto Supabase, la build in produzione ha mostrato alcuni errori
TypeScript che il mio Postgres locale non poteva anticipare del tutto:
- `invoices.remaining_amount` e le colonne delle viste (`project_financials`,
  `client_financials`) sono risultate `number | null` invece di `number`:
  le colonne generate/calcolate di una vista Postgres non portano garanzie
  NOT NULL nei metadati che gli strumenti leggono, anche quando la SQL
  (con `coalesce`) le rende sempre valorizzate in pratica. Corretto nei
  tipi e con fallback `?? 0` nei punti di visualizzazione — scelta
  semanticamente corretta, un aggregato assente equivale a zero.
- Le colonne di stato (`status`) a volte arrivano tipizzate come `string`
  invece dell'union letterale attesa: dipende da come il generatore reale
  legge il vincolo `check`, e può variare. Ho aggiunto
  `lib/enum-guards.ts`: funzioni che convalidano una stringa contro i
  valori ammessi e restituiscono il tipo letterale corretto con una
  ricaduta esplicita, usate ovunque un valore dal database deve entrare in
  un componente che si aspetta l'union — mai un cast alla cieca (`as any`
  o simili), che avrebbe nascosto il problema invece di risolverlo.

## Campi personalizzati sui progetti

Aggiunto su richiesta, dopo la Fase 13: i progetti hanno una colonna
`custom_fields` (JSONB) invece di colonne fisse — chi usa l'app può
aggiungere coppie nome/valore libere dal form (es. "Numero commessa",
"Referente tecnico") per progetti particolari, senza bisogno di toccare
il database o fare una migration per ogni nuovo campo.

Compromesso scelto deliberatamente: non essendo colonne vere, non si può
ordinare/filtrare per un campo personalizzato via SQL, e nella tabella
elenco progetti compare solo un piccolo indicatore (non colonne
aggiuntive vere e proprie) — mostrarli come colonne reali in tabella
richiederebbe gestire un insieme diverso di campi per ogni riga, poco
pratico con più di una manciata di progetti. I campi si vedono per intero
nella pagina di dettaglio del progetto.

## Un unico file per il setup database

`supabase/setup-completo.sql` combina tutte le migration in ordine in un
solo file, pensato per essere incollato una volta sola nell'SQL Editor di
Supabase (comodo per chi non usa la CLI). Va rigenerato se aggiungi nuove
migration — è la concatenazione dei file in `supabase/migrations/`, niente
di diverso da applicarli uno per uno.



Aggiunta dopo la Fase 13, su richiesta: l'app è ora installabile da
telefono ("Aggiungi a schermata Home" su Android/Chrome, stessa voce su
iOS/Safari) senza passare da nessuno store.

- `app/manifest.ts` — convenzione nativa di Next.js, genera
  `/manifest.webmanifest` da solo (visibile nell'output di `next build`).
- `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — icone
  segnaposto nello stesso stile del monogramma già usato per Electron e
  per la favicon web. Sostituiscile quando vuoi, stesse dimensioni.
- `public/sw.js` + `components/shared/sw-register.tsx` — service worker
  **volutamente minimale**: mette in cache solo le icone statiche, mai
  pagine autenticate o dati. Un service worker che mettesse in cache
  fatture o importi rischierebbe di mostrare dati scaduti, o su un
  dispositivo condiviso, di un altro utente dopo il logout. Serve solo a
  soddisfare i criteri di installabilità del browser.
- `app/layout.tsx` — aggiunta l'icona Apple e i meta tag
  `apple-mobile-web-app-*` (iOS non legge il manifest.json come Android,
  vuole i suoi meta tag dedicati), più `viewport.themeColor`.

**Diverso da un'app da App Store/Play Store**: questa è la stessa app web,
resa installabile — non richiede account sviluppatore né revisione, ma
nemmeno compare nello store. Per una presenza reale su Google Play/App
Store servirebbe avvolgerla con **Capacitor** (stesso principio di
Electron ma per mobile): fattibile, ma richiede Android Studio e/o Xcode,
un account sviluppatore Google (25$ una tantum) e uno Apple (99$/anno,
serve un Mac per la build iOS), oltre alla revisione di Apple per la
pubblicazione. Se vi serve, è un progetto a parte da impostare.

- **Componenti UI** (`components/ui/`): scritti a mano seguendo il pattern
  shadcn/ui (Button, Card, Badge, Separator, Input, Label, Sheet,
  DropdownMenu, Avatar, Skeleton, Table, Textarea, Dialog, AlertDialog,
  Select, Tabs, Popover, Checkbox). Se vuoi aggiungerne altri con la CLI ufficiale — cosa che
  qui non è stato possibile per via delle restrizioni di rete dell'ambiente
  di sviluppo — usa:

  ```bash
  npx shadcn@latest add tooltip combobox command
  ```

  Riconoscerà automaticamente `components.json` e la palette già configurata.

- **Font**: stack di font di sistema (nessuna dipendenza da Google Fonts in
  build), impostato in `app/globals.css`.

## Struttura

Vedi `docs/architettura-gestionale.md`, sezione 3, per la mappa completa delle
cartelle e la logica di ciascuna.

## Fase 14 — Second brain

- Home con obiettivi ad anello, calendario e panoramica; dashboard per Lavoro (`/lavoro`), Finanze e Vita (`/vita`).
- Scadenze in **giorni** (inizio + durata) con interruttore scorre/congelato per progetti, macro attività (Gantt) e task.
- Rubrica (`/rubrica`) collegabile ai progetti; pagine personalizzate con blocchi (testo, checklist, tabelle).
- Investimenti (`/finanze/investimenti`) e sezione Vita: affitti, allenamenti, viaggi, veicoli.
- Tema scuro (predefinito) e chiaro, con bottone sole/luna nella barra in alto (la scelta resta salvata nel browser); font Helvetica Neue con file woff2 inclusi in `public/fonts/`.
- **Da eseguire:** la migrazione `supabase/migrations/20260101000013_second_brain.sql` (già inclusa in `setup-completo.sql`).
