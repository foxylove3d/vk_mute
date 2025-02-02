document.addEventListener("DOMContentLoaded", () => {
    const mutedUsersList = document.getElementById("mutedUsersList");
    const disableCheckbox = document.getElementById("disableCheckbox");

    // Загружаем состояние кнопки и обновляем чекбокс
    chrome.storage.local.get(["mutedUsers", "extensionEnabled"], (data) => {
        disableCheckbox.checked = !!data.extensionEnabled;
        updateMutedUsersList([...new Set(data.mutedUsers || [])]); // Убираем дубли
    });

    // Обработчик переключателя включения/выключения расширения
    disableCheckbox.addEventListener("change", () => {
        chrome.storage.local.set({ extensionEnabled: disableCheckbox.checked });
        chrome.runtime.sendMessage({ action: "toggleExtension", enabled: disableCheckbox.checked });
    });

    // Функция обновления списка замьюченных пользователей
    function updateMutedUsersList(mutedUsers) {
        mutedUsersList.innerHTML = ""; // Полностью очищаем список перед обновлением

        // Проверяем, есть ли уже ник в списке перед добавлением
        const existingUsers = new Set();

        mutedUsers.forEach(userId => {
            if (!userId || existingUsers.has(userId)) return; // Пропускаем дубли
            existingUsers.add(userId);

            const listItem = document.createElement("li");
            listItem.innerText = userId + "  "; // Ник пользователя без слова "User" + отступ перед кнопкой

            const unmuteButton = document.createElement("button");
            unmuteButton.innerText = "Unmute";
            unmuteButton.style.marginLeft = "10px"; // Отступ кнопки от ника
            unmuteButton.addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: "unmuteUser", userId }, () => {
                    chrome.storage.local.get("mutedUsers", (data) => {
                        const updatedMutedUsers = (data.mutedUsers || []).filter(id => id !== userId);
                        chrome.storage.local.set({ mutedUsers: updatedMutedUsers });
                        updateMutedUsersList(updatedMutedUsers);
                    });
                });
            });

            listItem.appendChild(unmuteButton);
            mutedUsersList.appendChild(listItem);
        });
    }

    // Получаем актуальный список мьютов при открытии popup
    chrome.runtime.sendMessage({ action: "getMutedUsers" }, (response) => {
        if (response?.mutedUsers) {
            updateMutedUsersList([...new Set(response.mutedUsers)]); // Убираем дубли перед обновлением
        }
    });
});
