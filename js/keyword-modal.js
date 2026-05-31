// 제시어 모달
const topicModal = document.getElementById("topicModal");

// 제시어 텍스트
const topicText = document.getElementById("topicText");

// 게임 화면 왼쪽 상단 제시어
const topicHeaderText = document.getElementById("topicHeaderText");

// 확인 버튼
const topicConfirmBtn = document.getElementById("topicConfirmBtn");

/*
    임시 데이터
    나중에 백엔드 연결 시
    currentTopic = data.topic;
    로 변경
*/

let currentTopic = "프랑스";

// 모달 제시어
topicText.textContent = currentTopic;

// 좌측 상단 제시어
topicHeaderText.textContent = currentTopic;

/* 모달 닫기 */

topicConfirmBtn.addEventListener("click", () => {
    topicModal.classList.add("hidden");
});

/* 강제로 열기 */

function openTopicModal(topic) {

    topicText.textContent = topic;
    topicHeaderText.textContent = topic;

    topicModal.classList.remove("hidden");
}

/* 강제로 닫기 */

function closeTopicModal() {

    topicModal.classList.add("hidden");
}

