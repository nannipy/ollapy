import os
import json
import sys
from flask import Flask, request, jsonify, send_from_directory # type: ignore
from flask import Response # type: ignore

# Inizializza l'applicazione Flask
app = Flask(__name__)

# Add routes for static assets
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(app.root_path, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(app.root_path, 'js'), filename)

# Crea la directory dei log se non esiste
LOGS_DIR = 'logs'
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# API: Serve il file principale della chat
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/favicon.ico')
def favicon():
    # Un semplice SVG di una bolla di chat come icona
    svg_icon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M10 10 H 90 V 70 H 30 L 10 90 V 70 H 10 Z" 
        fill="#4a90e2" stroke="#e0e0e0" stroke-width="5"/>
    </svg>"""
    return Response(svg_icon, mimetype='image/svg+xml')

# API: Ottiene la lista di tutte le chat
@app.route('/api/chats', methods=['GET'])
def get_chats():
    chats = []
    for filename in os.listdir(LOGS_DIR):
        if filename.endswith('.json'):
            chat_id = filename.split('.')[0]
            try:
                with open(os.path.join(LOGS_DIR, filename), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    chats.append({
                        'id': data.get('id', chat_id),
                        'title': data.get('title', 'Chat senza titolo')
                    })
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Errore nel leggere il file {filename}: {e}")
    # Ordina per ID (timestamp) dal più recente al più vecchio
    chats.sort(key=lambda x: str(x['id']), reverse=True)
    return jsonify(chats)

# API: Ottiene il contenuto di una chat specifica
@app.route('/api/chats/<chat_id>', methods=['GET'])
def get_chat(chat_id):
    filepath = os.path.join(LOGS_DIR, f"{chat_id}.json")
    if os.path.exists(filepath):
        return send_from_directory(LOGS_DIR, f"{chat_id}.json")
    return jsonify({"error": "Chat non trovata"}), 404

# API: Salva (crea o aggiorna) una chat
@app.route('/api/chats', methods=['POST'])
def save_chat():
    chat_data = request.json
    chat_id = chat_data.get('id')
    if not chat_id:
        return jsonify({"error": "ID della chat mancante"}), 400
    
    filepath = os.path.join(LOGS_DIR, f"{chat_id}.json")
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, indent=2, ensure_ascii=False)
        return jsonify({"success": True, "id": chat_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API: Elimina una chat
@app.route('/api/chats/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    filepath = os.path.join(LOGS_DIR, f"{chat_id}.json")
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({"success": True})
    return jsonify({"error": "Chat non trovata"}), 404

# Avvia il server
if __name__ == '__main__':
    # Leggi la porta dalla riga di comando, con 8001 come default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    
    print(f"Avvio del server Flask su http://localhost:{port}")
    print("Questo server gestisce l'interfaccia e salva/carica le chat.")
    app.run(host='127.0.0.1', port=port)