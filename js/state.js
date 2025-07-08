// js/state.js
import { DEFAULT_OLLAMA_MODEL } from './config.js';

const LOCAL_STORAGE_KEY = 'ollama-chat-model';

let state = {
    activeChatId: null,
    currentChat: { id: null, title: '', history: [] },
    // NUOVA PARTE DELLO STATO
    currentModel: localStorage.getItem(LOCAL_STORAGE_KEY) || DEFAULT_OLLAMA_MODEL,
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