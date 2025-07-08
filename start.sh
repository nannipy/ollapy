#!/bin/bash

# --- Configurazione ---
SERVER_FILE="server.py"
PORT=8000
URL="http://localhost:$PORT"

# --- Funzione di pulizia ---
cleanup() {
    echo -e "\n\n SIGINT ricevuto. Chiusura dei server..."
    kill $server_pid
    kill $ollama_pid
    echo "Server chiusi. Uscita."
    exit
}
trap cleanup INT

# --- Controlli Preliminari ---
if ! command -v python3 &> /dev/null; then
    echo "Errore: Python 3 non trovato."
    exit 1
fi

if ! python3 -m pip show flask &> /dev/null; then
    echo "Errore: Flask non è installato. Esegui 'pip install Flask' per installarlo."
    exit 1
fi

if [ ! -f "$SERVER_FILE" ]; then
    echo "Errore: File '$SERVER_FILE' non trovato. Assicurati che sia in questa cartella."
    exit 1
fi

# --- Avvio dei Server ---
echo "1. Avvio del server Ollama in background..."
OLLAMA_ORIGINS="*" ollama serve &
ollama_pid=$!

echo "2. Avvio del web server Flask (che serve l'UI e gestisce i log) sulla porta $PORT..."
python3 $SERVER_FILE &
server_pid=$!

echo -e "\nServer avviati con successo:"
echo "  - Ollama PID: $ollama_pid"
echo "  - Web Server PID: $server_pid"
echo "  - Interfaccia web: $URL"

sleep 2

# --- Apertura del Browser ---
echo -e "\n3. Apertura della chat nel browser..."
if command -v xdg-open &> /dev/null; then
  xdg-open "$URL"
elif command -v open &> /dev/null; then
  open "$URL"
else
  echo "Non è stato possibile aprire il browser. Aprilo manualmente a: $URL"
fi

echo -e "\n--- La chat è pronta! ---"
echo "Premi Ctrl+C in questa finestra del terminale per chiudere tutto."

wait