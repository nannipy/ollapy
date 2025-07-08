
---

<p align="center">
    <img src="logo_ollapy.svg" alt="Ollapy Logo" width="180" style="border-radius: 15%;" />
</p>

# Localhost LLM Chat: La tua Chatroom AI Privata 🧠💬

[![Python](https://img.shields.io/badge/Python-3.x-blue.svg)](https://www.python.org/) [![Flask](https://img.shields.io/badge/Flask-2.x-black.svg)](https://flask.palletsprojects.com/) [![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)](https://developer.mozilla.org/it/docs/Web/JavaScript) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Stanco di inviare i tuoi pensieri più reconditi a server di terze parti? Vuoi il potere di un LLM ma nella privacy della tua fortezza digitale (aka `localhost`)? Allora sei nel posto giusto.**

Questo progetto è un'interfaccia web elegante e auto-contenuta per dialogare con i tuoi modelli linguistici locali tramite [Ollama](https://ollama.com/). È composto da un backend leggerissimo in Python/Flask e un frontend in puro JavaScript, senza framework pachidermici. Tutto ciò di cui hai bisogno, niente di superfluo.



 


---

## 🤔 Perché questo e non un altro?

Ci sono tante interfacce per Ollama, ma questa è stata costruita con alcuni dogmi in mente:

1.  **Privacy Assoluta:** L'unica richiesta di rete che esce dalla tua macchina è quella verso il tuo server Ollama locale. Nessun dato, nessuna telemetria, nessun cookie di profilazione. Il tuo `localhost`, le tue regole.
2.  **Persistenza Semplice:** Le tue chat non svaniscono nel nulla. Vengono salvate come semplici file `.json` in una directory `logs/`, rendendole facili da ispezionare, backuppare o persino modificare a mano (smanettone che non sei altro!).
3.  **Zero Dipendenze Complesse:** Niente Node.js, niente `npm install` da un miliardo di pacchetti. Solo un semplice server Python e un file HTML che funziona. È così semplice che fa quasi tenerezza.
4.  **Hackable by Design:** Il codice è volutamente chiaro e commentato. Vuoi cambiare il modello? È una variabile. Vuoi modificare lo stile? È un blocco CSS. Vuoi aggiungere una feature? Il codice non ti morderà.

## ✨ Caratteristiche Fighe

*   **💾 Cronologia Chat:** Tutte le tue conversazioni sono salvate e listate in una comoda barra laterale. Clicca per caricarle, clicca sulla `x` per eliminarle.
*   **✍️ Rendering Markdown:** L'AI può formattare il testo con liste, tabelle, blocchi di codice e altro, e l'interfaccia lo renderà splendidamente.
*   **💨 Streaming in Tempo Reale:** Vedi la risposta dell'AI apparire parola per parola, con un piccolo cursore lampeggiante, come se stesse pensando proprio per te.
*   **📊 Contatore di Token:** Tieni d'occhio la dimensione del contesto con una barra di avanzamento e un contatore, che cambia colore man mano che ti avvicini al limite.
*   **⏱️ Misuratore di Performance:** Ogni risposta dell'AI mostra quanto tempo ha impiegato per essere generata. Utile per vantarsi della potenza della tua GPU.
*   **🛡️ Sicurezza Integrata:** L'output HTML viene sanificato con `DOMPurify` per prevenire attacchi XSS. Perché anche su `localhost` è meglio essere prudenti.

## 🛠️ L'Architettura di questo Aggeggio

Il sistema si regge su due pilastri fondamentali:

1.  **`server.py` (Il Bibliotecario):**
    *   Un server **Flask** leggerissimo.
    *   Il suo unico scopo è servire il file `chat.html` e gestire un'API REST minimale per `creare`, `leggere`, `aggiornare` ed `eliminare` (CRUD) i file di log della chat. Non parla mai con l'AI.

2.  **`chat.html` (L'Arena):**
    *   Un unico file che contiene **HTML**, **CSS** e **JavaScript (vanilla)**.
    *   Comunica direttamente con il tuo server **Ollama** (di default `http://localhost:11434`).
    *   Comunica con `server.py` per salvare e caricare le sessioni di chat.

```mermaid
graph TD
    A[Utente 👨‍💻] -- Interagisce con --> B(Browser: chat.html);
    B -- Richieste API (Salva/Carica) --> C(Backend Flask: server.py);
    C -- Legge/Scrive --> D[File di Log (logs/*.json) 📝];
    B -- Richieste LLM (Prompt) --> E(Server Ollama 🧠);
    E -- Risposta in streaming --> B;
```

## 🚀 Pronti, Partenza, Via! (Installazione)

Mettere in funzione questa piccola meraviglia è un gioco da ragazzi.

### Prerequisiti

1.  **Python 3** e `pip` installati.
2.  **Ollama installato e in esecuzione.** Se non l'hai già fatto, segui le istruzioni su [ollama.com](https://ollama.com/).
3.  **Un modello scaricato.** Per esempio, per usare `gemma3` (come da default nel codice):
    ```bash
    ollama pull gemma3
    ```

### Installazione

1.  **Clona questo repository:**
    ```bash
    git clone https://github.com/tuo-username/localhost-llm-chat.git
    cd localhost-llm-chat
    ```

2.  **Installa le dipendenze Python (solo Flask):**
    ```bash
    pip install Flask
    # Oppure, se fornisci un file requirements.txt:
    # pip install -r requirements.txt
    ```

3.  **Avvia il server backend:**
    ```bash
    python server.py
    ```
    Dovresti vedere un messaggio che ti informa che il server è in esecuzione su `http://localhost:8000`.

4.  **Apri il tuo browser** e naviga su:
    👉 **http://localhost:8000** 👈

Fatto! Ora puoi iniziare a chattare con la tua AI personale.

## ⚙️ Metti a punto i Motori (Configurazione)

Vuoi usare un modello diverso da `gemma3`? O il tuo Ollama gira su una porta diversa? Apri `chat.html` e modifica queste costanti JavaScript all'inizio dello script:

```javascript
// --- CONFIGURAZIONE ---
const OLLAMA_MODEL = "mistral"; // Cambia qui il tuo modello preferito
const MAX_CONTEXT_WINDOW = 8192; // Modifica se il tuo modello ha un contesto diverso
```

Ricorda di fare `ollama pull nome-modello` per ogni nuovo modello che vuoi usare!

## 🤓 API Endpoints (Per gli Smanettoni)

Il server `server.py` espone una semplice API REST per la gestione delle chat. Potresti usarla per integrare la cronologia con altri script.

*   `GET /api/chats`
    *   **Risposta:** Un array JSON con la lista di tutte le chat salvate, ordinate dalla più recente alla più vecchia. `{ "id": "...", "title": "..." }`

*   `GET /api/chats/<chat_id>`
    *   **Risposta:** Il contenuto JSON completo della chat specificata.

*   `POST /api/chats`
    *   **Body:** L'oggetto JSON completo della chat da salvare/aggiornare.
    *   **Risposta:** Conferma del salvataggio.

*   `DELETE /api/chats/<chat_id>`
    *   **Risposta:** Conferma dell'eliminazione.

## 🤝 Vuoi dare una mano? (Contributing)

Questo progetto è nato per essere semplice, ma può sempre migliorare! Le Pull Request sono più che benvenute. Hai un'idea geniale? Hai scovato un bug più fastidioso di una zanzara in camera da letto?

1.  Forka il repository.
2.  Crea un nuovo branch (`git checkout -b feature/la-tua-idea-pazzesca`).
3.  Fai le tue modifiche.
4.  Invia una Pull Request.

Qualche idea per iniziare:
*   Un selettore per cambiare modello direttamente dall'interfaccia.
*   Temi (chiaro/scuro/cyberpunk?).
*   Esportazione di una singola chat in formato Markdown o PDF.

---

**Happy Hacking e che il tuo `localhost` sia sempre veloce e reattivo!**
