const waitingModal = document.getElementById("waitingModal");

function openWaitingModal() {
    waitingModal.classList.remove("hidden");
}

function closeWaitingModal() {
    waitingModal.classList.add("hidden");
}

// 콘솔에서 테스트할 수 있게 전역 등록
window.openWaitingModal = openWaitingModal;
window.closeWaitingModal = closeWaitingModal;
