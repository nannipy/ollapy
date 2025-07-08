// js/ui.js

// Esportiamo gli elementi del DOM per un facile accesso
export const dom = {
    form: document.getElementById('chat-form'),
    promptInput: document.getElementById('prompt-input'),
    sendButton: document.getElementById('send-button'),
    chatLog: document.getElementById('chat-log'),
    newChatBtn: document.getElementById('new-chat-btn'),
    chatHistoryList: document.getElementById('chat-history-list'),
    historySidebar: document.getElementById('history-sidebar'),
    tokenCountText: document.getElementById('token-count-text'),
    tokenProgressBarInner: document.getElementById('token-progress-bar-inner'),
    modelSelector: document.getElementById('model-selector'),
    modelNameSpan: document.getElementById('model-name-span'),
};


// Popola il menù a tendina dei modelli
export function populateModelSelector(models, selectedModel) {
    dom.modelSelector.innerHTML = '';
    models.forEach(modelName => {
        const option = document.createElement('option');
        option.value = modelName;
        option.textContent = modelName;
        if (modelName === selectedModel) {
            option.selected = true;
        }
        dom.modelSelector.appendChild(option);
    });
}
//Aggiorna il titolo della chat con il nome del modello
export function updateChatTitle(modelName) {
    // Estraiamo il nome base (es. "gemma3:latest" -> "Gemma3")
    const friendlyName = modelName.split(':')[0];
    const capitalizedName = friendlyName.charAt(0).toUpperCase() + friendlyName.slice(1);
    dom.modelNameSpan.textContent = capitalizedName;
}

export function renderHistoryList(chats, activeChatId, loadChatCallback, deleteChatCallback) {
    dom.chatHistoryList.innerHTML = '';
    chats.forEach(chat => {
        const li = document.createElement('li');
        li.dataset.chatId = chat.id;

        // NUOVO: Contenitore per titolo e tag
        const infoDiv = document.createElement('div');
        infoDiv.className = 'chat-info';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'chat-title';
        titleSpan.textContent = chat.title;
        infoDiv.appendChild(titleSpan);

        if (chat.model) {
            const modelTag = document.createElement('small');
            modelTag.className = 'model-tag';
            modelTag.textContent = chat.model.split(':')[0]; // Mostra solo il nome base
            infoDiv.appendChild(modelTag);
        }
        li.appendChild(infoDiv);

        if (chat.id === activeChatId) li.classList.add('active');
        
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteChatCallback(chat.id); };
        li.appendChild(deleteBtn);
        
        li.onclick = () => loadChatCallback(chat.id);
        dom.chatHistoryList.appendChild(li);
    });
}

export function setModelSelectorValue(modelName) {
    dom.modelSelector.value = modelName;
}

export function addMessageToLog(role, content, responseTime) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');
    
    if (role === 'assistant') {
        messageElement.innerHTML = DOMPurify.sanitize(marked.parse(content));
    } else {
        messageElement.textContent = content;
    }
    if (role === 'assistant' && responseTime) {
        addResponseTime(messageElement, responseTime);
    }
    dom.chatLog.appendChild(messageElement);
    scrollToBottom();
    return messageElement;
}

export function addResponseTime(element, duration) {
    const timeElement = document.createElement('div');
    timeElement.className = 'response-time-info';
    timeElement.textContent = `Risposta generata in ${duration}s`;
    element.appendChild(timeElement);
}

export function updateTokenUI(tokenCount, maxTokens) {
    const percentage = Math.min(100, (tokenCount / maxTokens) * 100);
    dom.tokenCountText.textContent = `${tokenCount.toLocaleString('it-IT')} / ${maxTokens.toLocaleString('it-IT')} tokens`;
    dom.tokenProgressBarInner.style.width = `${percentage}%`;
    if (percentage < 50) dom.tokenProgressBarInner.style.backgroundColor = 'var(--color-green)';
    else if (percentage < 75) dom.tokenProgressBarInner.style.backgroundColor = 'var(--color-yellow)';
    else if (percentage < 90) dom.tokenProgressBarInner.style.backgroundColor = 'var(--color-orange)';
    else dom.tokenProgressBarInner.style.backgroundColor = 'var(--color-red)';
}

export function toggleLoading(isLoading) {
    dom.sendButton.disabled = isLoading;
    dom.historySidebar.classList.toggle('sidebar-disabled', isLoading);
    if (!isLoading) {
        dom.promptInput.focus();
    }
}

export function clearChatLog() {
    dom.chatLog.innerHTML = '';
}

export function clearPromptInput() {
    dom.promptInput.value = '';
}

export function scrollToBottom() {
    dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
}