# Come creare il tuo spazio dati (Supabase) — guida passo passo

Questa guida ti fa creare un tuo account gratuito dove verranno salvati i
tuoi dati (clienti, fatture, progetti...), separato da quello di [nome
amico]. Ci vogliono circa 10 minuti. Non serve installare niente sul
computer, si fa tutto dal browser.

Alla fine dovrai solo mandare due informazioni a [nome amico] (spiegato al
punto 7) — lui farà l'ultimo collegamento.

---

## 1. Crea l'account

1. Vai su **[supabase.com](https://supabase.com)**
2. Clicca **"Start your project"** (in alto a destra)
3. Iscriviti con la tua email, oppure con l'account Google/GitHub se ne hai
   uno — è il metodo più veloce
4. Conferma l'email se richiesto

## 2. Crea il progetto

1. Una volta dentro, clicca **"New project"**
2. Ti verrà chiesta un'organizzazione: se è la prima volta, Supabase ne
   crea una automaticamente col tuo nome — va benissimo, lascia tutto com'è
3. Compila:
   - **Name**: scrivi `gestionale` (o quello che preferisci, è solo
     un'etichetta per te)
   - **Database Password**: clicca "Generate a password" e **salvala da
     qualche parte sicura** (un file, le note del telefono) — non ti
     servirà quasi mai, ma se la perdi è un problema
   - **Region**: scegli quella più vicina a te, es. *Central EU (Frankfurt)*
4. Clicca **"Create new project"**
5. Aspetta 1-2 minuti mentre Supabase prepara tutto (vedrai una barra di
   caricamento)

## 3. Crea le tabelle (una volta sola)

1. Nel menu a sinistra, clicca l'icona **"SQL Editor"** (sembra `</>`)
2. Clicca **"New query"**
3. Apri il file `setup-completo.sql` che trovi nella cartella del
   progetto, **seleziona tutto il contenuto e copialo** (Ctrl+A poi Ctrl+C
   — o Cmd+A / Cmd+C su Mac)
4. Torna su Supabase e **incolla tutto** nella casella grande
5. Clicca il pulsante verde **"Run"** in basso a destra (o Ctrl+Invio)
6. Dovresti vedere un messaggio verde tipo "Success" in basso — significa
   che ha funzionato. Se vedi scritto rosso "Error", fai uno screenshot e
   mandalo a [nome amico], non andare avanti da solo

## 4. Sistema l'email per il recupero password

Questo passaggio serve perché in futuro, se dimentichi la password, il
link che ricevi via email funzioni davvero.

1. Nel menu a sinistra, clicca **"Authentication"**
2. Clicca su **"Email Templates"** (nel sottomenu)
3. Clicca su **"Reset Password"**
4. Troverai un testo con dentro un link. Cerca la parte che assomiglia a
   `{{ .ConfirmationURL }}` e sostituiscila con esattamente questa riga
   (copiala tutta):

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/recupera-password/aggiorna
   ```

5. Clicca **"Save"**

## 5. Attiva la conferma via email (consigliato)

1. Sempre in "Authentication", clicca **"Sign In / Providers"** (o
   "Providers" a seconda della versione)
2. Assicurati che **"Email"** sia attivo (di solito lo è già di default)

Non serve toccare altro qui.

## 6. Trova i due codici da mandare a [nome amico]

1. Nel menu a sinistra, clicca l'icona a forma di ingranaggio **"Project
   Settings"**
2. Clicca **"API"** nel sottomenu
3. Vedrai due cose che ti servono:
   - **Project URL**: un indirizzo tipo `https://xxxxxxxxxxxx.supabase.co`
   - **anon public**: una chiave lunga (sotto "Project API keys")

### ⚠️ Attenzione — leggi questa parte

Nella stessa pagina c'è anche una chiave chiamata **`service_role`**, a
volte con scritto accanto "secret". **Quella non va mai copiata né
mandata a nessuno**, nemmeno a [nome amico] — è come la chiave
principale che apre tutto senza controlli. Manda solo la **Project URL**
e la chiave **anon public** (a volte chiamata anche solo "anon" o
"public").

## 7. Manda le due informazioni

Manda a [nome amico], per email o messaggio:

- La **Project URL** (es. `https://xxxxxxxxxxxx.supabase.co`)
- La chiave **anon public** (una stringa lunga che inizia di solito con
  `eyJ...`)

Lui si occuperà dell'ultimo collegamento. Dopo, quando ti registri
sull'app la prima volta, quello diventerà il tuo account: i tuoi dati
saranno solo tuoi, su un progetto solo tuo.

---

## Cose da NON fare

- Non condividere mai la password del database (punto 2) né la chiave
  `service_role` (punto 6) con nessuno, nemmeno per chiedere aiuto — se
  qualcuno ti chiede quelle due cose per "aiutarti", è quasi certamente
  una truffa
- Non serve creare più di un progetto: uno solo basta per tutto il
  gestionale
