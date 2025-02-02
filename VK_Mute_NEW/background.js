chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ mutedUsers: [], extensionEnabled: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.storage.local.get(["mutedUsers", "extensionEnabled"], (data) => {
        let mutedUsers = data.mutedUsers || [];
        let extensionEnabled = data.extensionEnabled ?? true;

        if (message.action === "muteUser") {
            if (!mutedUsers.includes(message.userId)) {
                mutedUsers.push(message.userId);
                chrome.storage.local.set({ mutedUsers }, () => {
                    sendResponse({ success: true });
                });
            }
        }

        if (message.action === "unmuteUser") {
            mutedUsers = mutedUsers.filter(id => id !== message.userId);
            chrome.storage.local.set({ mutedUsers }, () => {
                sendResponse({ success: true });
            });
        }

        if (message.action === "getMutedUsers") {
            sendResponse({ mutedUsers });
        }

        if (message.action === "toggleExtension") {
            chrome.storage.local.set({ extensionEnabled: message.enabled });
        }
    });

    return true;
});
