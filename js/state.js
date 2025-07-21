// js/state.js
import { DEFAULT_OLLAMA_MODEL } from './config.js';

const LOCAL_STORAGE_KEY = 'ollama-chat-model';

let state = {
    activeChatId: null,
    currentChat: { id: null, title: '', history: [] },
    currentModel: localStorage.getItem(LOCAL_STORAGE_KEY) || DEFAULT_OLLAMA_MODEL,
    modelContextWindows: {}, // Nuovo: Mappa dei modelli con le loro finestre di contesto
};


export function getActiveChatId() {
    return state.activeChatId;
}

export function getCurrentChat() {
    return state.currentChat;
}

export function updateCurrentChat(newChatData) {
    state.currentChat = { ...state.currentChat, ...newChatData };
}

export function pushToHistory(turn) {
    state.currentChat.history.push(turn);
}

export function setActiveChat(chatId, chatData) {
    state.activeChatId = chatId;
    state.currentChat = chatData;
}

export function resetState() {
    state.activeChatId = null;
    state.currentChat = { id: null, title: '', history: [] };
}


// FUNZIONI PER GESTIRE IL MODELLO
export function getCurrentModel() {
    return state.currentModel;
}

export function setCurrentModel(modelName) {
    state.currentModel = modelName;
    localStorage.setItem(LOCAL_STORAGE_KEY, modelName);
}

// NUOVE FUNZIONI PER GESTIRE LE FINESTRE DI CONTESTO DEI MODELLI
export function setModelContextWindows(models) {
    state.modelContextWindows = models.reduce((acc, model) => {
        acc[model.name] = model.context_window;
        return acc;
    }, {});
    console.log("Updated modelContextWindows:", JSON.stringify(state.modelContextWindows, null, 2));
}

export function getContextWindowForModel(modelName) {
    return state.modelContextWindows[modelName];
}

let attachments = []; // Array per gli allegati

export function getAttachments() { return attachments; }
export function addAttachment(file) {
    if (!attachments.some(existingFile => existingFile.name === file.name)) {
        attachments.push(file);
    }
}
export function removeAttachment(fileName) {
    attachments = attachments.filter(file => file.name !== fileName);
}
export function clearAttachments() { attachments = []; }