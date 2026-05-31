/* ==============================================
   my-ui.js  |  순환 버그 수정 및 수첩 기능 완벽 연동 버전
   ============================================== */

/* ── 1. 플레이어 정보 및 상태 ── */
const PLAYERS = [
    { name: "Player 1", bubbleClass: "bubble-1", isDead: false, isAI: false, memo: "", isSuspect: false },
    { name: "Player 2", bubbleClass: "bubble-2", isDead: false, isAI: false, memo: "", isSuspect: false },
    { name: "Player 3", bubbleClass: "bubble-3", isDead: false, isAI: true,  memo: "", isSuspect: false }, // 테스트용 AI
    { name: "Player 4", bubbleClass: "bubble-4", isDead: false, isAI: false, memo: "", isSuspect: false },
    { name: "Player 5", bubbleClass: "bubble-5", isDead: false, isAI: false, memo: "", isSuspect: false },
];

let currentTurn = 0; 
let isFreeTalkPhase = false;
let pendingExecutionTarget = null; 
let freeTalkTimerInterval = null;
let timeLeft = 5; // ★ 테스트용 5초 (실제 60초로 변경)
let turnCounter = 0; // ★ 버그 해결의 핵심: 채팅 친 횟수 기록

/* DOM 참조 */
const turnPlayerName = document.getElementById("turn-player-name");
const turnPips = document.querySelectorAll(".turn-pip");
const freeTalkModal = document.getElementById("freeTalkModal");
const turnIndicator = document.getElementById("turn-indicator");
const timerWrap = document.getElementById("timerWrap");
const timerDisplay = document.getElementById("timerDisplay");

const voteModal = document.getElementById("voteModal");
const voteList = document.getElementById("voteList");

const confirmExecuteModal = document.getElementById("confirmExecuteModal");
const confirmTargetName = document.getElementById("confirmTargetName");

const verdictModal = document.getElementById("verdictModal");
const verdictPlayerName = document.getElementById("verdictPlayerName");
const verdictIdentity = document.getElementById("verdictIdentity");
const verdictStamp = document.getElementById("verdictStamp");

const resultModal = document.getElementById("resultModal");

/* ==============================================
   [Phase 1] 턴 표시기 & 말풍선
   ============================================== */
function updateTurnIndicator() {
    if (isFreeTalkPhase) return;
    const player = PLAYERS[currentTurn];
    turnPlayerName.textContent = player.name;
    turnPips.forEach((pip, i) => pip.classList.toggle("active", i === currentTurn));
}

function triggerBubblePop(el) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "bubble-pop 0.25s ease both";
}

/* ==============================================
   [Phase 2 & 3] 자유 토론 시작 및 타이머
   ============================================== */
function openFreeTalkModal() { 
    if(freeTalkModal) freeTalkModal.classList.remove("hidden"); 
}

const freeTalkConfirmBtn = document.getElementById("freeTalkConfirmBtn");
if (freeTalkConfirmBtn) {
    freeTalkConfirmBtn.addEventListener("click", () => {
        freeTalkModal.classList.add("hidden");
        
        isFreeTalkPhase = true;
        turnIndicator.classList.add("free-talk-mode");
        turnPlayerName.textContent = "FREE TALK";
        turnIndicator.querySelector(".turn-label").textContent = "OPEN DISCUSSION";

        timeLeft = 5; // ★ 테스트용 (실제 60초로 변경)
        timerDisplay.textContent = timeLeft;
        timerWrap.classList.remove("hidden");

        freeTalkTimerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(freeTalkTimerInterval);
                timerWrap.classList.add("hidden");
                openVoteModal(); 
            }
        }, 1000);
    });
}

/* ==============================================
   [Phase 4] 투표 모달
   ============================================== */
function openVoteModal() {
    voteList.innerHTML = "";
    const survivors = PLAYERS.map((p, i) => ({ index: i, player: p })).filter(s => !s.player.isDead);
    
    survivors.forEach(s => {
        const div = document.createElement("div");
        div.className = "vote-option";
        div.innerHTML = `
            <input type="radio" name="voteTarget" id="vote_${s.index}" value="${s.index}">
            <label for="vote_${s.index}">${s.player.name}</label>
        `;
        voteList.appendChild(div);
    });

    if(voteModal) voteModal.classList.remove("hidden");
}

const voteConfirmBtn = document.getElementById("voteConfirmBtn");
if (voteConfirmBtn) {
    voteConfirmBtn.addEventListener("click", () => {
        const selected = document.querySelector('input[name="voteTarget"]:checked');
        if (!selected) {
            alert("투표할 플레이어를 선택해주세요!");
            return;
        }
        voteModal.classList.add("hidden");

        const targetIndex = parseInt(selected.value);
        const targetPlayer = PLAYERS[targetIndex];
        pendingExecutionTarget = { index: targetIndex, isAI: targetPlayer.isAI, name: targetPlayer.name };

        // 정체 공개 대신 '처형 확인 모달' 띄우기
        confirmTargetName.textContent = targetPlayer.name;
        confirmExecuteModal.classList.remove("hidden");
    });
}

/* ==============================================
   [Phase 4.5] 처형 재확인 모달
   ============================================== */
const cancelExecuteBtn = document.getElementById("cancelExecuteBtn");
if (cancelExecuteBtn) {
    cancelExecuteBtn.addEventListener("click", () => {
        confirmExecuteModal.classList.add("hidden");
        openVoteModal(); // 다시 선택
    });
}

const doExecuteBtn = document.getElementById("doExecuteBtn");
if (doExecuteBtn) {
    doExecuteBtn.addEventListener("click", () => {
        confirmExecuteModal.classList.add("hidden");
        openVerdictModal(pendingExecutionTarget.name, pendingExecutionTarget.isAI);
    });
}

/* ==============================================
   [Phase 5] 정체 공개 모달
   ============================================== */
function openVerdictModal(playerName, isAI) {
    verdictStamp.classList.remove("stamp-active");
    verdictPlayerName.textContent = playerName;

    if (isAI) {
        verdictIdentity.textContent = "AI (인공지능)";
        verdictIdentity.style.color = "#8c1d18";
    } else {
        verdictIdentity.textContent = "HUMAN (인간)";
        verdictIdentity.style.color = "#3a6b40";
    }

    verdictModal.classList.remove("hidden");
    setTimeout(() => { verdictStamp.classList.add("stamp-active"); }, 200);
}

const verdictConfirmBtn = document.getElementById("verdictConfirmBtn");
if (verdictConfirmBtn) {
    verdictConfirmBtn.addEventListener("click", () => {
        verdictModal.classList.add("hidden");
        
        const targetIndex = pendingExecutionTarget.index;
        setPlayerDead(targetIndex + 1);

        if (PLAYERS[targetIndex].isAI) {
            setTimeout(() => openResultModal("human"), 500);
        } else {
            const survivors = PLAYERS.filter(p => !p.isDead);
            if (survivors.length <= 1) {
                setTimeout(() => openResultModal("ai"), 500);
            } else {
                setTimeout(startNewRound, 1000); 
            }
        }
    });
}

/* ==============================================
   [Phase 6] 결과 모달 & 다음 라운드 리셋
   ============================================== */
function openResultModal(winner) {
    if (winner === "human") {
        document.getElementById("resultTitle").textContent = "HUMAN VICTORY";
        document.getElementById("resultDesc").textContent = "AI를 성공적으로 처형했습니다!";
    } else {
        document.getElementById("resultTitle").textContent = "AI VICTORY";
        document.getElementById("resultDesc").textContent = "시민들이 모두 희생되었습니다.";
    }
    resultModal.classList.remove("hidden");
}

const resultBackBtn = document.getElementById("resultBackBtn");
if (resultBackBtn) {
    resultBackBtn.addEventListener("click", () => {
        location.href = "index.html"; 
    });
}

function startNewRound() {
    isFreeTalkPhase = false;
    turnCounter = 0; // ★ 라운드가 바뀌면 채팅 횟수 초기화!
    
    turnIndicator.classList.remove("free-talk-mode");
    turnIndicator.querySelector(".turn-label").textContent = "NOW SPEAKING";

    const survivors = PLAYERS.map((p, i) => ({ index: i, player: p })).filter(s => !s.player.isDead);
    currentTurn = survivors[0].index; // 첫 번째 생존자로 턴 세팅
    updateTurnIndicator();
}

/* ==============================================
   채팅 & 탈락자 처리 핵심 로직
   ============================================== */
function setPlayerDead(playerIndex) {
    const tag = document.querySelector(`.player-tag.player-${playerIndex}`);
    const bubble = document.querySelector(`.speech-bubble.bubble-${playerIndex}`);
    if(!tag) return;
    
    if (!tag.querySelector(".eliminated-label")) {
        const label = document.createElement("div");
        label.className = "eliminated-label";
        label.textContent = "ELIMINATED";
        tag.appendChild(label);
    }
    tag.classList.add("is-dead");
    if(bubble) bubble.classList.add("is-dead");
    PLAYERS[playerIndex - 1].isDead = true;
    
    renderNotebookCards();
}

window.sendMessage = function() {
    const chatInput = document.getElementById("chatInput");
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (message === "") return;

    // 1. 말풍선 띄우기
    const player = PLAYERS[currentTurn];
    const bubble = document.querySelector(`.${player.bubbleClass} .bubble-body`);
    if (bubble) {
        bubble.textContent = message;
        triggerBubblePop(bubble);
    }
    chatInput.value = "";

    // 2. 자유 채팅 중이면 여기서 종료
    if (isFreeTalkPhase) return;

    // 3. 턴제 모드일 때: 말한 횟수 증가
    turnCounter++;
    
    const survivorsCount = PLAYERS.filter(p => !p.isDead).length;

    // 4. 생존자 수만큼 다 말했으면 완벽하게 자유토론 모달 띄우기
    if (turnCounter >= survivorsCount) {
        setTimeout(openFreeTalkModal, 400);
    } else {
        // 아직 덜 말했으면 다음 생존자에게 턴 넘기기
        let next = (currentTurn + 1) % PLAYERS.length;
        while (PLAYERS[next].isDead) {
            next = (next + 1) % PLAYERS.length;
        }
        currentTurn = next;
        updateTurnIndicator();
    }
}

/* ==============================================
   탐정 수첩 로직 (데이터 저장 & 말풍선 시각 효과 연동)
   ============================================== */
const nbTab = document.getElementById("notebookTab");
const nbOverlay = document.getElementById("notebookOverlay");
const nbPanel = document.getElementById("notebookPanel");
const nbClose = document.getElementById("notebookClose");
const nbSaveStatus = document.getElementById("nbSaveStatus");
const nbClearAll = document.getElementById("nbClearAll");
let saveTimeout;

function toggleNotebook() {
    if(nbPanel) nbPanel.classList.toggle("hidden");
    if(nbOverlay) nbOverlay.classList.toggle("hidden");
}

if(nbTab) nbTab.addEventListener("click", toggleNotebook);
if(nbClose) nbClose.addEventListener("click", toggleNotebook);
if(nbOverlay) nbOverlay.addEventListener("click", toggleNotebook);

function showSaveStatus() {
    if(nbSaveStatus) {
        nbSaveStatus.textContent = "SAVING...";
        nbSaveStatus.style.opacity = "0.5";
        nbSaveStatus.style.color = "#c8a020"; 
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            nbSaveStatus.textContent = "SAVED";
            nbSaveStatus.style.opacity = "1";
            nbSaveStatus.style.color = "#3a6b40"; 
        }, 600);
    }
}

// ★ 추가됨: 메인 보드 말풍선 안쪽에 메모/용의자 표시
function updateMainBoardIndicators() {
    PLAYERS.forEach((player, index) => {
        const bubble = document.querySelector(`.speech-bubble.bubble-${index + 1}`);
        if (bubble) {
            let memoTag = bubble.querySelector('.board-memo-tag');
            if (!memoTag) {
                memoTag = document.createElement('div');
                memoTag.className = 'board-memo-tag';
                bubble.appendChild(memoTag);
            }

            // 죽은 사람이면 표시 안 함
            if (player.isDead) {
                memoTag.style.display = 'none';
                return;
            }

            // 메모가 있거나 용의자 체크가 되어있으면 표시
            if (player.isSuspect || player.memo.trim() !== "") {
                memoTag.style.display = 'flex';
                let contentHTML = '';
                if (player.isSuspect) {
                    contentHTML += `<span class="suspect-mark">🚨 SUSPECT</span>`;
                }
                if (player.memo.trim() !== "") {
                    contentHTML += `<span class="memo-text">${player.memo}</span>`;
                }
                memoTag.innerHTML = contentHTML;
            } else {
                memoTag.style.display = 'none';
            }
        }
    });
}

function renderNotebookCards() {
    const nbCards = document.getElementById("nbCards");
    if(!nbCards) return;
    nbCards.innerHTML = "";
    
    PLAYERS.forEach((player, index) => {
        const opacity = player.isDead ? "0.5" : "1";
        const card = document.createElement("div");
        card.className = "nb-card";
        card.style.opacity = opacity;
        
        const isChecked = player.isSuspect ? "checked" : "";
        
        card.innerHTML = `
            <div class="nb-card-header">
                <span>${player.name}</span>
                <label>
                    <input type="checkbox" class="nb-suspect-check" ${player.isDead ? "disabled" : ""} ${isChecked}> 
                    SUSPECT
                </label>
            </div>
            <textarea class="nb-textarea" placeholder="메모를 입력하세요..." ${player.isDead ? "disabled" : ""}>${player.memo}</textarea>
        `;
        
        const textarea = card.querySelector(".nb-textarea");
        const checkbox = card.querySelector(".nb-suspect-check");
        
        // 글씨 쓸 때마다 실시간으로 말풍선 업데이트
        textarea.addEventListener("input", (e) => {
            PLAYERS[index].memo = e.target.value;
            showSaveStatus();
            updateMainBoardIndicators();
        });
        
        checkbox.addEventListener("change", (e) => {
            PLAYERS[index].isSuspect = e.target.checked;
            showSaveStatus();
            updateMainBoardIndicators();
        });
        
        nbCards.appendChild(card);
    });
    
    updateMainBoardIndicators();
}

// ★ 수정됨: CLEAR ALL 버튼 완벽 작동 로직
if (nbClearAll) {
    nbClearAll.addEventListener("click", () => {
        if (confirm("모든 메모와 용의자 지목을 초기화하시겠습니까?")) {
            PLAYERS.forEach(p => { 
                p.memo = ""; 
                p.isSuspect = false; 
            });
            renderNotebookCards(); // 화면 초기화
            showSaveStatus();
        }
    });
}

// 최초 실행
updateTurnIndicator();
renderNotebookCards();