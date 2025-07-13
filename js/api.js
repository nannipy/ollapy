// js/api.js
import { OLLAMA_BASE_URL } from './config.js';

// API per il nostro backend Flask
export async function getChats() {
    const response = await fetch('/api/chats');
    return await response.json();
}

export async function getChat(id) {
    const response = await fetch(`/api/chats/${id}`);
    return await response.json();
}

export async function saveChat(chatData) {
    return fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatData),
    });
}

export async function deleteChat(id) {
    return fetch(`/api/chats/${id}`, { method: 'DELETE' });
}

// NUOVA FUNZIONE: Ottiene i modelli locali da Ollama
export async function getOllamaTags() {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
        console.error(`Ollama API Error: Status ${response.status}, Text: ${response.statusText}`);
        throw new Error(`Impossibile contattare il server Ollama per ottenere i modelli. Status: ${response.status}, Testo: ${response.statusText}`);
    }
    const data = await response.json();
    
    const modelsWithContext = await Promise.all(data.models.map(async (model) => {
        try {
            const showResponse = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: model.name }),
            });
            if (!showResponse.ok) {
                console.warn(`Impossibile ottenere dettagli per il modello ${model.name}: ${showResponse.statusText}`);
                return { name: model.name, context_window: 4096 }; // Fallback
            }
            const showData = await showResponse.json();
            let contextWindow = 4096; // Default fallback
            
            // Check model_info for context_length or num_ctx
            if (showData.model_info) {
                for (const key in showData.model_info) {
                    if (key.includes('context_length') || key.includes('num_ctx')) {
                        contextWindow = showData.model_info[key];
                        break; // Found it, no need to check further
                    }
                }
            }
            return { name: model.name, context_window: contextWindow };
        } catch (error) {
            console.error(`Errore nel recupero dei dettagli per il modello ${model.name}:`, error);
            return { name: model.name, context_window: 4096 }; // Fallback in caso di errore
        }
    }));
    return modelsWithContext;
}

// MODIFICATA: La funzione ora accetta il modello come argomento
export async function streamOllamaResponse(history, model, onChunk, onDone, signal) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: history, stream: true }),
        signal: signal,
    });

    if (!response.ok) {
        throw new Error(`Errore dal server Ollama: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            onDone();
            break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                try {
                    onChunk(JSON.parse(line));
                } catch (e) {
                    console.error('Errore parsing JSON:', e, 'su linea:', line);
                }
            }
        });
    }
}