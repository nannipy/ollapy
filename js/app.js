// js/app.js
console.log("APP.JS LOADED");
import * as config from './config.js';
import * as api from './api.js';
import * as state from './state.js';
import * as ui from './ui.js';

let currentAbortController = null; // Per gestire l'annullamento delle richieste

// --- LOGICA DI BUSINESS E GESTIONE EVENTI ---

async function loadChat(chatId) {
    try {
        const chatData = await api.getChat(chatId);
        if (chatData && chatData.id) {
            const modelToLoad = chatData.model || state.getCurrentModel();
            
            state.setCurrentModel(modelToLoad);
            ui.setModelSelectorValue(modelToLoad);
            ui.updateChatTitle(modelToLoad);
            
            state.setActiveChat(chatData.id, chatData);
            ui.clearChatLog();
            state.getCurrentChat().history.forEach(turn => ui.addMessageToLog(turn.role, turn.content, turn.responseTime));
            
            await refreshHistoryList();
            updateTotalTokenCount();

        } else {
            await startNewChat();
        }
    } catch (error) {
        console.error("Errore nel caricamento della chat:", error);
        await startNewChat();
    }
}

async function startNewChat() {
    state.resetState();
    ui.clearChatLog();
    await refreshHistoryList();
    updateTotalTokenCount();
}

async function deleteChat(chatId) {
    if (!confirm("Sei sicuro di voler eliminare questa chat?")) return;
    await api.deleteChat(chatId);
    if (state.getActiveChatId() === chatId) {
        await startNewChat();
    } else {
        await refreshHistoryList();
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const userPrompt = ui.dom.promptInput.value.trim();
    if (!userPrompt) return;

    const startTime = performance.now();
    ui.clearPromptInput();
    ui.toggleLoading(true);

    if (!state.getActiveChatId()) {
        const newChatId = Date.now().toString();
        const newChat = {
            id: newChatId,
            title: userPrompt.length > 30 ? userPrompt.substring(0, 27) + '...' : userPrompt,
            history: [],
            model: state.getCurrentModel()
        };
        state.setActiveChat(newChatId, newChat);
        await api.saveChat(state.getCurrentChat());
        await refreshHistoryList();
    }

    ui.addMessageToLog('user', userPrompt);
    state.pushToHistory({ role: 'user', content: userPrompt });
    updateTotalTokenCount();

    const aiMessageElement = ui.addMessageToLog('assistant', '<span class="cursor"></span>');
    let fullResponse = '';

    // Inizializza un nuovo AbortController per ogni richiesta
    currentAbortController = new AbortController();

    try {
        await api.streamOllamaResponse(
            state.getCurrentChat().history,
            state.getCurrentModel(),
            // onChunk
            (parsed) => {
                if (parsed.message && parsed.message.content) {
                    fullResponse += parsed.message.content;
                }
                const htmlContent = marked.parse(fullResponse);
                aiMessageElement.innerHTML = DOMPurify.sanitize(htmlContent) + '<span class="cursor"></span>';
                ui.scrollToBottom();

                if (parsed.done) {
                    state.pushToHistory({ role: 'assistant', content: fullResponse });
                    updateTotalTokenCount();
                }
            },
            // onDone
            async () => {
                aiMessageElement.querySelector('.cursor')?.remove();
                const duration = ((performance.now() - startTime) / 1000).toFixed(2);
                ui.addResponseTime(aiMessageElement, duration);

                const lastTurn = state.getCurrentChat().history[state.getCurrentChat().history.length - 1];
                if (lastTurn.role === 'assistant') {
                    lastTurn.responseTime = duration;
                }
                await api.saveChat(state.getCurrentChat());
            },
            currentAbortController.signal // Passa il segnale di annullamento
        );
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn("Richiesta annullata dall'utente.");
            aiMessageElement.textContent = 'Risposta annullata.';
            aiMessageElement.style.color = 'var(--color-yellow)'; // Colore per annullato
        } else {
            console.error('Errore chiamata a Ollama:', error);
            aiMessageElement.style.color = '#ff8a80';
            aiMessageElement.textContent = `Errore: ${error.message}. Assicurati che Ollama sia attivo.`;
        }
    } finally {
        ui.toggleLoading(false);
        currentAbortController = null; // Resetta il controller
    }
}

async function handleModelChange(event) {
    const newModel = event.target.value;
    state.setCurrentModel(newModel);
    ui.updateChatTitle(newModel);
    updateTotalTokenCount(); // Aggiorna il contatore quando il modello cambia
    await startNewChat();
}

function handleCancelClick() {
    if (currentAbortController) {
        currentAbortController.abort();
    }
}

// --- FUNZIONI UTILITY INTERNE AD APP.JS ---

function estimateTokens(text) { return Math.ceil(text.length / 4); }

function updateTotalTokenCount() {
    const fullText = state.getCurrentChat().history.map(turn => turn.content).join(' ');
    const tokenCount = estimateTokens(fullText);
    const maxTokens = state.getContextWindowForModel(state.getCurrentModel()) || config.MAX_CONTEXT_WINDOW; // Usa il valore dinamico o il default
    console.log(`Token Count: ${tokenCount}, Max Tokens: ${maxTokens}, Current Model: ${state.getCurrentModel()}`);
    ui.updateTokenUI(tokenCount, maxTokens);
}

async function refreshHistoryList() {
    const chats = await api.getChats();
    ui.renderHistoryList(chats, state.getActiveChatId(), loadChat, deleteChat);
}

// --- INIZIALIZZAZIONE ---

async function init() {
    // Imposta il titolo iniziale
    ui.updateChatTitle(state.getCurrentModel());

    // Aggiungi listener per gli eventi principali
    ui.dom.form.addEventListener('submit', handleFormSubmit);
    ui.dom.newChatBtn.addEventListener('click', startNewChat);
    ui.dom.modelSelector.addEventListener('change', handleModelChange);
    ui.dom.toggleSidebarBtn.addEventListener('click', ui.toggleSidebar);
    ui.dom.cancelButton.addEventListener('click', handleCancelClick); // Listener per il pulsante Annulla

    // Popola il selettore dei modelli
    try {
        const models = await api.getOllamaTags();
        console.log("Models received from Ollama API:", JSON.stringify(models, null, 2));
        state.setModelContextWindows(models); // Salva le finestre di contesto
        ui.populateModelSelector(models.map(m => m.name), state.getCurrentModel()); // Popola il selettore con i nomi
    } catch (error) {
        console.error("Impossibile caricare i modelli da Ollama:", error);
        ui.populateModelSelector([state.getCurrentModel()], state.getCurrentModel());
        alert("Errore: impossibile caricare la lista dei modelli da Ollama. Assicurati che sia in esecuzione. Verrà usato il modello di default.");
    }

    // Avvia la prima chat
    await startNewChat();
}

// Esegui l'inizializzazione solo quando il DOM è pronto.
document.addEventListener('DOMContentLoaded', init);

    // Ascolta gli eventi di sistema dal processo principale
    if (window.electronAPI) {
        window.electronAPI.onSystemInfo((info) => {
            ui.updateSystemInfoUI(info.cpu, info.ram);
        });
    }