#!/bin/bash

# --- Configurazione ---
HTML_FILE="index.html" # Assicurati che il tuo file HTML si chiami così
PORT=8000
URL="http://localhost:$PORT/$HTML_FILE"

# --- Funzione di pulizia ---
# Questa funzione viene eseguita quando premi Ctrl+C
cleanup() {
    echo -e "\n\n SIGINT ricevuto. Chiusura dei server..."
    # Uccide il processo del web server e di ollama usando i loro PID
    kill $server_pid
    kill $ollama_pid
    echo "Server chiusi. Uscita."
    exit
}

# Imposta la "trap" per intercettare il segnale di interruzione (Ctrl+C)
trap cleanup INT

# --- Controlli Preliminari ---
if [ ! -f "$HTML_FILE" ]; then
    echo "Errore: File '$HTML_FILE' non trovato in questa cartella."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Errore: Python 3 non trovato. È necessario per avviare il web server."
    exit 1
fi

# --- Avvio dei Server ---

echo "1. Avvio del server Ollama in background..."
OLLAMA_ORIGINS="*" ollama serve &
ollama_pid=$! # Salva il Process ID (PID) del server ollama

echo "2. Avvio del web server Python sulla porta $PORT in background..."
python3 -m http.server $PORT &
server_pid=$! # Salva il PID del web server

echo -e "\nServer avviati con successo:"
echo "  - Ollama PID: $ollama_pid"
echo "  - Web Server PID: $server_pid"
echo "  - Interfaccia web: $URL"

# Attendi 2 secondi per dare ai server il tempo di avviarsi
sleep 2

# --- Apertura del Browser ---
echo -e "\n3. Apertura della chat nel browser..."
# Comando cross-platform per macOS e Linux
if command -v xdg-open &> /dev/null; then
  xdg-open "$URL"
elif command -v open &> /dev/null; then
  open "$URL"
else
  echo "Non è stato possibile aprire il browser automaticamente. Aprilo manualmente a: $URL"
fi

echo -e "\n--- La chat è pronta! ---"
echo "Premi Ctrl+C in questa finestra del terminale per chiudere tutto."

# Mantiene lo script in esecuzione, in attesa del segnale di chiusura
wait