const topicModal = document.getElementById("topicModal");
const topicConfirmBtn = document.getElementById("topicConfirmBtn");
const topicText = document.getElementById("topicText");
const topicHeaderText = document.getElementById("topicHeaderText");

const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

let currentTopic = "프랑스";

topicText.textContent = currentTopic;
topicHeaderText.textContent = currentTopic;

topicConfirmBtn.addEventListener("click", () => {
    topicModal.classList.add("hidden");
});

sendBtn.addEventListener("click", () => {
    sendMessage();
});

chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function sendMessage() {
    const message = chatInput.value.trim();

    if (message === "") {
        return;
    }

    console.log("message:", message);

    chatInput.value = "";
}
