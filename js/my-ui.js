/* ==============================================
   my-ui.js  |  누락된 함수 복구 및 턴 버그 완벽 수정본
   ============================================== */

const PLAYERS = [
    { name: "Player 1", bubbleClass: "bubble-1", isDead: false, isAI: false, memo: "", isSuspect: false },
    { name: "Player 2", bubbleClass: "bubble-2", isDead: false, isAI: false, memo: "", isSuspect: false },
    { name: "Player 3", bubbleClass: "bubble-3", isDead: false, isAI: true,  memo: "", isSuspect: false }, 
    { name: "Player 4", bubbleClass: "bubble-4", isDead: false, isAI: false, memo: "", isSuspect: false },
    { name: "Player 5", bubbleClass: "bubble-5", isDead: false, isAI: false, memo: "", isSuspect: false },
];

let currentTurn = 0; 
let isFreeTalkPhase = false;
let isLastWordPhase = false; 
let pendingExecutionTarget = null; 
let freeTalkTimerInterval = null;
let timeLeft = 60; 

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

const finalDecisionModal = document.getElementById("finalDecisionModal");
const finalDecisionTargetName = document.getElementById("finalDecisionTargetName");
const btnSpare = document.getElementById("btnSpare");
const btnExecute = document.getElementById("btnExecute");

const verdictModal = document.getElementById("verdictModal");
const verdictPlayerName = document.getElementById("verdictPlayerName");
const verdictIdentity = document.getElementById("verdictIdentity");
const verdictStamp = document.getElementById("verdictStamp");
const resultModal = document.getElementById("resultModal");

/* ==============================================
   [Phase 1 & 2] 턴 표시기 및 자유 토론
   ============================================== */
function updateTurnIndicator() {
    if (isFreeTalkPhase || isLastWordPhase) return;
    const player = PLAYERS[currentTurn];
    if(turnPlayerName) turnPlayerName.textContent = player.name;
    turnPips.forEach((pip, i) => pip.classList.toggle("active", i === currentTurn));
}

function triggerBubblePop(el) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "bubble-pop 0.25s ease both";
}

// ★ 실수로 지웠던 자유 토론 창 띄우는 함수 복구 완료! ★
function openFreeTalkModal() {
    if(freeTalkModal) freeTalkModal.classList.remove("hidden");
}

if (document.getElementById("freeTalkConfirmBtn")) {
    document.getElementById("freeTalkConfirmBtn").addEventListener("click", () => {
        freeTalkModal.classList.add("hidden");
        isFreeTalkPhase = true;
        turnIndicator.classList.add("free-talk-mode");
        turnPlayerName.textContent = "FREE TALK";
        turnIndicator.querySelector(".turn-label").textContent = "OPEN DISCUSSION";

        timeLeft = 5; 
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
    if(!voteList) return;
    voteList.innerHTML = "";
    PLAYERS.map((p, i) => ({ index: i, player: p })).filter(s => !s.player.isDead).forEach(s => {
        const div = document.createElement("div");
        div.className = "vote-option";
        div.innerHTML = `<input type="radio" name="voteTarget" id="vote_${s.index}" value="${s.index}"><label for="vote_${s.index}">${s.player.name}</label>`;
        voteList.appendChild(div);
    });
    voteModal.classList.remove("hidden");
}

if (document.getElementById("voteConfirmBtn")) {
    document.getElementById("voteConfirmBtn").addEventListener("click", () => {
        const selected = document.querySelector('input[name="voteTarget"]:checked');
        if (!selected) return alert("투표할 플레이어를 선택해주세요!");
        voteModal.classList.add("hidden");
        
        const targetIndex = parseInt(selected.value);
        pendingExecutionTarget = { index: targetIndex, isAI: PLAYERS[targetIndex].isAI, name: PLAYERS[targetIndex].name };
        if(confirmTargetName) confirmTargetName.textContent = pendingExecutionTarget.name;
        if(confirmExecuteModal) confirmExecuteModal.classList.remove("hidden");
    });
}

/* ==============================================
   [Phase 4.5] 유언 돌입 및 최종 결정 모달
   ============================================== */
if (document.getElementById("cancelExecuteBtn")) {
    document.getElementById("cancelExecuteBtn").addEventListener("click", () => {
        confirmExecuteModal.classList.add("hidden");
        openVoteModal();
    });
}

if (document.getElementById("doExecuteBtn")) {
    document.getElementById("doExecuteBtn").addEventListener("click", () => {
        confirmExecuteModal.classList.add("hidden");
        
        isLastWordPhase = true;
        currentTurn = pendingExecutionTarget.index;
        
        turnIndicator.classList.add("last-word-mode");
        turnPlayerName.textContent = pendingExecutionTarget.name;
        turnIndicator.querySelector(".turn-label").textContent = "LAST WORDS (10s)";
        
        let lastWordTime = 10;
        timerDisplay.textContent = lastWordTime;
        timerWrap.classList.remove("hidden");
        
        freeTalkTimerInterval = setInterval(() => {
            lastWordTime--;
            timerDisplay.textContent = lastWordTime;
            
            if (lastWordTime <= 0) {
                clearInterval(freeTalkTimerInterval);
                timerWrap.classList.add("hidden");
                turnIndicator.classList.remove("last-word-mode");
                
                if(finalDecisionTargetName) finalDecisionTargetName.textContent = pendingExecutionTarget.name;
                if(finalDecisionModal) finalDecisionModal.classList.remove("hidden");
            }
        }, 1000);
    });
}

if(btnSpare) {
    btnSpare.addEventListener("click", () => {
        finalDecisionModal.classList.add("hidden");
        startNewRound(); 
    });
}
if(btnExecute) {
    btnExecute.addEventListener("click", () => {
        finalDecisionModal.classList.add("hidden");
        openVerdictModal(pendingExecutionTarget.name, pendingExecutionTarget.isAI);
    });
}

/* ==============================================
   [Phase 5] 정체 공개 및 승패
   ============================================== */
function openVerdictModal(playerName, isAI) {
    if(verdictStamp) verdictStamp.classList.remove("stamp-active");
    if(verdictPlayerName) verdictPlayerName.textContent = playerName;
    if(verdictIdentity) {
        verdictIdentity.textContent = isAI ? "AI (인공지능)" : "HUMAN (인간)";
        verdictIdentity.style.color = isAI ? "#8c1d18" : "#3a6b40";
    }
    if(verdictModal) verdictModal.classList.remove("hidden");
    setTimeout(() => { if(verdictStamp) verdictStamp.classList.add("stamp-active"); }, 200);
}

if (document.getElementById("verdictConfirmBtn")) {
    document.getElementById("verdictConfirmBtn").addEventListener("click", () => {
        verdictModal.classList.add("hidden");
        setPlayerDead(pendingExecutionTarget.index + 1);

        if (pendingExecutionTarget.isAI) {
            setTimeout(() => openResultModal("human"), 500);
        } else {
            const survivors = PLAYERS.filter(p => !p.isDead);
            if (survivors.length <= 1) setTimeout(() => openResultModal("ai"), 500);
            else setTimeout(startNewRound, 1000); 
        }
    });
}

function openResultModal(winner) {
    if (winner === "human") {
        document.getElementById("resultTitle").textContent = "HUMAN VICTORY";
        document.getElementById("resultDesc").textContent = "AI를 성공적으로 처형했습니다!";
    } else {
        document.getElementById("resultTitle").textContent = "AI VICTORY";
        document.getElementById("resultDesc").textContent = "시민들이 모두 희생되었습니다.";
    }
    if(resultModal) resultModal.classList.remove("hidden");
}

if (document.getElementById("resultBackBtn")) {
    document.getElementById("resultBackBtn").addEventListener("click", () => { location.href = "index.html"; });
}

function startNewRound() {
    isFreeTalkPhase = false;
    isLastWordPhase = false;
    clearInterval(freeTalkTimerInterval);
    
    turnIndicator.classList.remove("free-talk-mode", "last-word-mode");
    turnIndicator.querySelector(".turn-label").textContent = "NOW SPEAKING";
    timerWrap.classList.add("hidden");

    const firstSurvivorIndex = PLAYERS.findIndex(p => !p.isDead);
    currentTurn = firstSurvivorIndex;
    updateTurnIndicator();
}

/* ==============================================
   [핵심] 채팅 및 턴 순환 로직
   ============================================== */
function setPlayerDead(playerIndex) {
    const tag = document.querySelector(`.player-tag.player-${playerIndex}`);
    const bubble = document.querySelector(`.speech-bubble.bubble-${playerIndex}`);
    if(tag) {
        tag.classList.add("is-dead");
        if (!tag.querySelector(".eliminated-label")) {
            const label = document.createElement("div");
            label.className = "eliminated-label"; label.textContent = "ELIMINATED"; tag.appendChild(label);
        }
    }
    if(bubble) bubble.classList.add("is-dead");
    PLAYERS[playerIndex - 1].isDead = true;
    renderNotebookCards();
}

window.sendMessage = function() {
    const input = document.getElementById("chatInput");
    if (!input || input.value.trim() === "") return;
    const message = input.value.trim();

    const player = PLAYERS[currentTurn];
    const bubble = document.querySelector(`.${player.bubbleClass} .bubble-body`);

    // 1. 유언 모드일 때
    if (isLastWordPhase) {
        clearInterval(freeTalkTimerInterval);
        timerWrap.classList.add("hidden");
        turnIndicator.classList.remove("last-word-mode");
        
        if (bubble) { bubble.textContent = message; triggerBubblePop(bubble); }
        input.value = "";
        
        setTimeout(() => {
            if(finalDecisionTargetName) finalDecisionTargetName.textContent = pendingExecutionTarget.name;
            if(finalDecisionModal) finalDecisionModal.classList.remove("hidden");
        }, 1000);
        return;
    }

    // 2. 일반 모드일 때
    if (bubble) { bubble.textContent = message; triggerBubblePop(bubble); }
    input.value = "";

    if (isFreeTalkPhase) return;

    // 3. 턴 돌리기 (다음 생존자 찾기)
    let next = (currentTurn + 1) % PLAYERS.length;
    while (PLAYERS[next].isDead) {
        next = (next + 1) % PLAYERS.length;
    }

    const firstSurvivorIndex = PLAYERS.findIndex(p => !p.isDead);

    // ★ 한 바퀴 다 돌았으면 아까 복구한 openFreeTalkModal() 호출!
    if (next === firstSurvivorIndex) {
        setTimeout(openFreeTalkModal, 400);
    } else {
        currentTurn = next;
        updateTurnIndicator();
    }
}

/* ==============================================
   수첩 로직 (데이터 유지 & 보드 연동)
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
            if (player.isDead) {
                memoTag.style.display = 'none';
                return;
            }
            if (player.isSuspect || player.memo.trim() !== "") {
                memoTag.style.display = 'flex';
                let contentHTML = '';
                if (player.isSuspect) contentHTML += `<span class="suspect-mark">🚨 SUSPECT</span>`;
                if (player.memo.trim() !== "") contentHTML += `<span class="memo-text">${player.memo}</span>`;
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
                <label><input type="checkbox" class="nb-suspect-check" ${player.isDead ? "disabled" : ""} ${isChecked}> SUSPECT</label>
            </div>
            <textarea class="nb-textarea" placeholder="메모를 입력하세요..." ${player.isDead ? "disabled" : ""}>${player.memo}</textarea>
        `;
        
        const textarea = card.querySelector(".nb-textarea");
        const checkbox = card.querySelector(".nb-suspect-check");
        
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

if (nbClearAll) {
    nbClearAll.addEventListener("click", () => {
        if (confirm("모든 메모와 용의자 지목을 초기화하시겠습니까?")) {
            PLAYERS.forEach(p => { p.memo = ""; p.isSuspect = false; });
            renderNotebookCards(); 
            showSaveStatus();
        }
    });
}

// 최초 실행
updateTurnIndicator();
renderNotebookCards();