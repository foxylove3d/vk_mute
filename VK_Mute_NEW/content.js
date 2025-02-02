document.addEventListener("mouseover", (event) => {
    const peerTitle = event.target.closest(".PeerTitle__title");
    if (peerTitle) {
        addMuteButton(peerTitle);
    }
});

function addMuteButton(titleContainer) {
    let existingMuteBtn = titleContainer.querySelector(".mute-btn");

    if (!existingMuteBtn) {
        const muteBtn = document.createElement("button");
        muteBtn.innerHTML = "🔇";
        muteBtn.classList.add("mute-btn");

        Object.assign(muteBtn.style, {
            cursor: "pointer",
            border: "none",
            background: "transparent",
            marginLeft: "5px",
            fontSize: "16px",
            display: "none" // Изначально скрыта
        });

        muteBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            event.preventDefault();

            const userId = getUserIdFromTitle(titleContainer);
            if (userId) {
                chrome.runtime.sendMessage({ action: "muteUser", userId }, () => {
                    hideMessages(userId);
                });
            }
        });

        titleContainer.appendChild(muteBtn);

        titleContainer.addEventListener("mouseenter", () => {
            muteBtn.style.display = "inline-block";
        });

        titleContainer.addEventListener("mouseleave", () => {
            muteBtn.style.display = "none";
        });
    }
}

function getUserIdFromTitle(titleContainer) {
    const userLink = titleContainer.closest(".ConvoMessageWithoutBubble")?.querySelector(".ConvoMessageHeader__authorLink");

    if (userLink && userLink.href) {
        const userIdMatch = userLink.href.match(/\/([\w\d_.-]+)$/);
        return userIdMatch ? userIdMatch[1] : null;
    }

    return null;
}

function hideMessages(mutedUserId) {
    const messages = document.querySelectorAll(".ConvoMessageWithoutBubble");

    messages.forEach(message => {
        const authorLink = message.querySelector(".ConvoMessageHeader__authorLink");

        if (authorLink && authorLink.href.includes(mutedUserId)) {
            message.style.display = "none";
        }
    });
}

function showMessages(mutedUserId) {
    const messages = document.querySelectorAll(".ConvoMessageWithoutBubble");

    messages.forEach(message => {
        const authorLink = message.querySelector(".ConvoMessageHeader__authorLink");

        if (authorLink && authorLink.href.includes(mutedUserId)) {
            message.style.display = "";
        }
    });
}

// Проверяем статус плагина и скрываем/отображаем сообщения
chrome.runtime.sendMessage({ action: "getMutedUsers" }, (response) => {
    chrome.storage.local.get("pluginEnabled", (data) => {
        const isEnabled = data.pluginEnabled ?? true;
        const mutedUsers = response?.mutedUsers || [];

        mutedUsers.forEach(userId => {
            if (isEnabled) {
                hideMessages(userId);
            } else {
                showMessages(userId);
            }
        });
    });
});

// Отслеживаем изменения в DOM
const observer = new MutationObserver(() => {
    chrome.runtime.sendMessage({ action: "getMutedUsers" }, (response) => {
        chrome.storage.local.get("pluginEnabled", (data) => {
            const isEnabled = data.pluginEnabled ?? true;
            const mutedUsers = response?.mutedUsers || [];

            mutedUsers.forEach(userId => {
                if (isEnabled) {
                    hideMessages(userId);
                } else {
                    showMessages(userId);
                }
            });
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// Обработка изменения состояния плагина
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateMessagesVisibility") {
        chrome.runtime.sendMessage({ action: "getMutedUsers" }, (response) => {
            chrome.storage.local.get("pluginEnabled", (data) => {
                const isEnabled = data.pluginEnabled ?? true;
                const mutedUsers = response?.mutedUsers || [];

                mutedUsers.forEach(userId => {
                    if (isEnabled) {
                        hideMessages(userId);
                    } else {
                        showMessages(userId);
                    }
                });
            });
        });
    }
});
