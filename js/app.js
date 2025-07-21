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
    state.clearAttachments();
    ui.clearAttachmentsUI();
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

    let userPrompt = ui.dom.promptInput.value.trim();
    const attachments = state.getAttachments();

    if (!userPrompt && attachments.length === 0) return;

    // Aggiungi il contenuto degli allegati al prompt
    if (attachments.length > 0) {
        const attachmentsContent = attachments
            .map(file => `--- ALLEGATO: ${file.name} ---\n${file.content}`)
            .join('\n\n');
        userPrompt = userPrompt 
            ? `${userPrompt}\n\n${attachmentsContent}`
            : attachmentsContent;
    }

    const startTime = performance.now();
    ui.clearPromptInput();
    state.clearAttachments();
    ui.clearAttachmentsUI();
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
    const currentPrompt = ui.dom.promptInput.value.trim();
    const attachments = state.getAttachments();
    
    let combinedText = state.getCurrentChat().history.map(turn => turn.content).join(' ');
    
    if (currentPrompt) {
        combinedText += ` ${currentPrompt}`;
    }

    if (attachments.length > 0) {
        const attachmentsContent = attachments
            .map(file => file.content)
            .join(' ');
        combinedText += ` ${attachmentsContent}`;
    }

    const tokenCount = estimateTokens(combinedText);
    const maxTokens = state.getContextWindowForModel(state.getCurrentModel()) || config.MAX_CONTEXT_WINDOW;
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
document.addEventListener('DOMContentLoaded', () => {
    init();

    // Ascolta gli eventi di sistema dal processo principale
    if (window.electronAPI) {
        window.electronAPI.onSystemInfo((info) => {
            ui.updateSystemInfoUI(info.cpu, info.ram);
        });
    }

    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        promptInput.addEventListener('input', function() {
            autoResizeTextarea(this);
            updateTotalTokenCount(); // Aggiorna il contatore dei token all'input
        });
        // Inizializza l'altezza corretta
        autoResizeTextarea(promptInput);

        // Gestione invio con Command+Enter e nuova riga con Enter
        promptInput.addEventListener('keydown', function(e) {
            // Su Mac: metaKey è il tasto Command
            if (e.key === 'Enter' && e.metaKey) {
                e.preventDefault();
                // Trova il form e invia
                const form = document.getElementById('chat-form');
                if (form) form.requestSubmit();
            } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
                // Solo Enter: va a capo normalmente (default comportamento textarea)
                // Non faccio nulla, lascio il comportamento di default
            }
        });
    }

    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.querySelector('.sidebar-controls');
    const appLayout = document.querySelector('.app-layout');

    if (toggleBtn && sidebar && appLayout) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            appLayout.classList.toggle('sidebar-collapsed');
        });
    }

    const chatContainer = document.querySelector('.chat-container');
    const dropZone = document.getElementById('drop-zone');

    let dragCounter = 0;

    chatContainer.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            chatContainer.classList.add('drag-over');
        }
    });

    chatContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter === 0) {
            chatContainer.classList.remove('drag-over');
        }
    });

    chatContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    chatContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        chatContainer.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            
            let filesProcessed = 0;
            for (const file of files) {
                if (file.type.startsWith('text/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const fileContent = event.target.result;
                        state.addAttachment({ name: file.name, content: fileContent });
                        filesProcessed++;
                        if (filesProcessed === files.length) {
                            ui.renderAttachments(state.getAttachments(), removeAttachment);
                            updateTotalTokenCount(); // Update token count after adding attachments
                        }
                    };
                    reader.onerror = (error) => {
                        console.error("Errore nella lettura del file:", error);
                        alert("Impossibile leggere il file.");
                        filesProcessed++;
                        if (filesProcessed === files.length) {
                            ui.renderAttachments(state.getAttachments(), removeAttachment);
                            updateTotalTokenCount(); // Update token count even on error
                        }
                    };
                    reader.readAsText(file);
                } else {
                    alert(`File non supportato: ${file.name}. Puoi allegare solo file di testo.`);
                    filesProcessed++;
                    if (filesProcessed === files.length) {
                        ui.renderAttachments(state.getAttachments(), removeAttachment);
                        updateTotalTokenCount(); // Update token count even if file is not supported
                    }
                }
            }
        }
    });
});

// Espansione automatica della textarea fino a 10 righe
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const maxRows = 10;
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20;
    const maxHeight = lineHeight * maxRows;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}



function removeAttachment(fileName) {
    state.removeAttachment(fileName);
    ui.renderAttachments(state.getAttachments(), removeAttachment);
    updateTotalTokenCount(); // Update token count after removing attachments
}