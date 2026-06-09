// js/ui-render.js
// 서버 데이터 처리 + 커스텀 UI 통합본 (프리토킹 UI 초기화 완벽 적용)

(function () {
  const playersData = [
    { slot: 1, id: null, name: "Player 1", isDead: false, memo: "", isSuspect: false },
    { slot: 2, id: null, name: "Player 2", isDead: false, memo: "", isSuspect: false },
    { slot: 3, id: null, name: "Player 3", isDead: false, memo: "", isSuspect: false },
    { slot: 4, id: null, name: "Player 4", isDead: false, memo: "", isSuspect: false },
    { slot: 5, id: null, name: "Player 5", isDead: false, memo: "", isSuspect: false }
  ];
  const playerSlotById = new Map();
  let freeTalkTimerInterval = null;
  let pendingVoteTarget = null; 

  let myPlayerId = null;
  function setMyPlayerId(id) { 
    myPlayerId = String(id); 
    console.log("🔑 내 플레이어 ID가 설정됨:", myPlayerId);
  }
  function getMyPlayerId() { return myPlayerId; }

  function $(selector) { return document.querySelector(selector); }
  function setText(selector, text) { const el = $(selector); if (el) el.textContent = text ?? ""; }

  function getPlayerSlot(playerIdOrSlot) {
    if (!playerIdOrSlot) return null;
    const value = String(playerIdOrSlot).trim();
    if (playerSlotById.has(value)) return playerSlotById.get(value);
    if (/^[1-5]$/.test(value)) return Number(value);
    const match = value.match(/player[_-]?([1-5])/i);
    if (match) return Number(match[1]);
    return null;
  }

  function showWaitingRoom(current, required, message) {
    if ($("#topicModal")) $("#topicModal").classList.add("hidden");
    if ($("#waitingModal")) $("#waitingModal").classList.remove("hidden");
    setText(".waiting-status", `WAITING... ${current}/${required}`);
    setText("#waitingModal .waiting-panel p", message || `플레이어를 기다리는 중입니다. (${current}/${required})`);
  }

  function hideWaitingRoom() {
    if ($("#waitingModal")) $("#waitingModal").classList.add("hidden");
  }

  function updatePlayerNames(players) {
    playerSlotById.clear();
    if (!Array.isArray(players)) return;
    players.slice(0, 5).forEach((player, index) => {
      const slot = index + 1;
      const playerId = player.id || player.player_id;
      const nickname = player.nickname || `Player ${slot}`;
      
      if (playerId) playerSlotById.set(String(playerId), slot);
      playersData[index].id = playerId;
      playersData[index].name = nickname;
      playersData[index].isDead = player.is_eliminated || false;

      setText(`.player-tag.player-${slot}`, nickname);
      setText(`.bubble-${slot} .bubble-header`, nickname);
    });
    renderNotebookCards();
  }

  function updateKeyword(keyword) {
    setText("#topicHeaderText", keyword || "제시어");
    setText("#topicText", keyword || "제시어 불러오는 중...");

    const mySlot = getPlayerSlot(myPlayerId);
    const myName = mySlot ? playersData[mySlot - 1].name : "관전자";

    let roleElem = $("#myRoleText");
    if (!roleElem) {
      roleElem = document.createElement("div");
      roleElem.id = "myRoleText";
      roleElem.style.cssText = "margin-top: 25px; font-size: 20px; color: #8c1d18; font-weight: bold; background: #e8d5b5; padding: 12px; border-radius: 8px; border: 2px dashed #8c1d18;";
      const btn = $("#topicConfirmBtn");
      if (btn) btn.parentNode.insertBefore(roleElem, btn);
    }
    if (roleElem) roleElem.innerHTML = `당신은 <span style="font-size:28px; color:#6f1d16; margin: 0 8px;">[ ${myName} ]</span> 입니다!`;
    if ($("#topicModal")) $("#topicModal").classList.remove("hidden");
  }

  // ★ 새로 교체된 showCurrentTurn 함수! (프리톡 껍데기 벗기기 추가)
  function showCurrentTurn(playerId, timeout) {
    // 1. 혹시 돌고 있던 프리토킹/최후의발언 타이머 강제 종료
    clearInterval(freeTalkTimerInterval); 
    
    // 2. ★ 프리톡 & 최후의 발언 모드 껍데기 완벽하게 벗겨내기 (초기화)
    const indicator = $("#turn-indicator");
    if (indicator) {
      indicator.classList.remove("free-talk-mode", "last-word-mode");
      setText("#turn-indicator .turn-label", "NOW SPEAKING");
    }

    const slot = getPlayerSlot(playerId);
    const playerName = slot ? playersData[slot - 1].name : "Player";
    setText("#turn-player-name", playerName);
    
    const pips = document.querySelectorAll(".turn-pip");
    pips.forEach((pip, i) => pip.classList.toggle("active", i === (slot - 1)));

    if ($("#timerWrap")) $("#timerWrap").classList.remove("hidden");
    setText("#timerDisplay", timeout || 60);
  }

  function showPlayerBubble(playerId, content) {
    console.log(`💬 말풍선 요청됨! 대상 ID: [${playerId}], 내용: [${content}]`);
    const slot = getPlayerSlot(playerId);
    
    if (!slot) {
      console.error(`❌ 슬롯 매핑 실패! [${playerId}]에 해당하는 플레이어를 화면에서 찾을 수 없습니다.`);
      return;
    }

    const bubble = $(`.bubble-${slot}`);
    const bubbleBody = $(`.bubble-${slot} .bubble-body`);
    
    if (bubbleBody) {
      bubbleBody.textContent = content || "";
      console.log(`✅ ${slot}번 말풍선에 내용 삽입 성공!`);
    }
    
    if (bubble) {
      bubble.style.display = "block"; 
      bubble.classList.add("active");
      bubble.style.animation = "none";
      void bubble.offsetWidth;
      bubble.style.animation = "bubble-pop 0.25s ease both";
    }
  }

  function showTypingStatus(playerId, isTyping) { }

  function showFreeTalkStart(duration) {
    if ($("#freeTalkModal")) $("#freeTalkModal").classList.remove("hidden");
    document.getElementById("freeTalkConfirmBtn").onclick = () => {
      $("#freeTalkModal").classList.add("hidden");
      $("#turn-indicator").classList.add("free-talk-mode");
      setText("#turn-player-name", "FREE TALK");
      setText("#turn-indicator .turn-label", "OPEN DISCUSSION");
      let timeLeft = duration || 60;
      $("#timerWrap").classList.remove("hidden");
      setText("#timerDisplay", timeLeft);
      clearInterval(freeTalkTimerInterval);
      freeTalkTimerInterval = setInterval(() => {
        timeLeft--;
        setText("#timerDisplay", timeLeft);
        if (timeLeft <= 0) {
          clearInterval(freeTalkTimerInterval);
          $("#timerWrap").classList.add("hidden");
        }
      }, 1000);
    };
  }

  function showVoteStart() {
    clearInterval(freeTalkTimerInterval);
    $("#timerWrap").classList.add("hidden");
    $("#turn-indicator").classList.remove("free-talk-mode");
    const voteList = $("#voteList");
    voteList.innerHTML = "";
    playersData.filter(p => !p.isDead).forEach(p => {
      const div = document.createElement("div");
      div.className = "vote-option";
      div.innerHTML = `<input type="radio" name="voteTarget" id="vote_${p.slot}" value="${p.slot}"><label for="vote_${p.slot}">${p.name}</label>`;
      voteList.appendChild(div);
    });
    $("#voteModal").classList.remove("hidden");
  }

  function showVerdictResult(data) {
    const eliminatedId = data.eliminated_player_id;
    const isHuman = data.was_human;
    const slot = getPlayerSlot(eliminatedId);
    if (slot) {
      playersData[slot - 1].isDead = true;
      const tag = $(`.player-tag.player-${slot}`);
      const bubble = $(`.speech-bubble.bubble-${slot}`);
      if(tag) {
        tag.classList.add("is-dead");
        if (!tag.querySelector(".eliminated-label")) {
            const label = document.createElement("div");
            label.className = "eliminated-label"; label.textContent = "ELIMINATED"; tag.appendChild(label);
        }
      }
      if(bubble) bubble.classList.add("is-dead");
      renderNotebookCards();
    }
    const playerName = slot ? playersData[slot - 1].name : "UNKNOWN";
    $("#verdictStamp").classList.remove("stamp-active");
    setText("#verdictPlayerName", playerName);
    setText("#verdictIdentity", isHuman ? "HUMAN (인간)" : "AI (인공지능)");
    $("#verdictIdentity").style.color = isHuman ? "#3a6b40" : "#8c1d18";
    $("#verdictModal").classList.remove("hidden");
    setTimeout(() => { $("#verdictStamp").classList.add("stamp-active"); }, 200);
  }

  function showGameOver(data) {
    if ($("#resultModal")) $("#resultModal").classList.remove("hidden");
    setText("#resultTitle", "GAME OVER");
    setText("#resultStamp", (data.result === "human_win" ? "HUMAN" : "AI") + " WIN");
    setText("#resultDesc", data.message || "게임이 종료되었습니다.");
  }

  // ── 5. 탐정 수첩 로직 ──
  let saveTimeout;
  function toggleNotebook() {
    const panel = $("#notebookPanel");
    const overlay = $("#notebookOverlay");
    if (panel) panel.classList.toggle("hidden");
    if (overlay) overlay.classList.toggle("hidden");
  }

  function showSaveStatus() {
    const st = $("#nbSaveStatus");
    if(st) {
      st.textContent = "SAVING...";
      st.style.opacity = "0.5"; st.style.color = "#c8a020"; 
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        st.textContent = "SAVED"; st.style.opacity = "1"; st.style.color = "#3a6b40"; 
      }, 600);
    }
  }

  function updateMainBoardIndicators() {
    playersData.forEach(player => {
      const bubble = $(`.speech-bubble.bubble-${player.slot}`);
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
    const nbCards = $("#nbCards");
    if(!nbCards) return;
    nbCards.innerHTML = "";
    playersData.forEach((player) => {
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
      card.querySelector(".nb-textarea").addEventListener("input", (e) => {
        player.memo = e.target.value; showSaveStatus(); updateMainBoardIndicators();
      });
      card.querySelector(".nb-suspect-check").addEventListener("change", (e) => {
        player.isSuspect = e.target.checked; showSaveStatus(); updateMainBoardIndicators();
      });
      nbCards.appendChild(card);
    });
    updateMainBoardIndicators();
  }

  // 외부 노출 API
  window.UIRender = {
    setMyPlayerId, 
    getMyPlayerId,
    updatePlayerNames,
    updateKeyword,
    showPlayerBubble,
    showWaitingRoom,
    hideWaitingRoom,
    showCurrentTurn,
    showFreeTalkStart,
    showTypingStatus,
    showVerdictResult,
    showVoteStart,
    showGameOver
  };

  document.addEventListener("DOMContentLoaded", () => {
    if ($("#notebookTab")) $("#notebookTab").addEventListener("click", toggleNotebook);
    if ($("#notebookClose")) $("#notebookClose").addEventListener("click", toggleNotebook);
    if ($("#notebookOverlay")) $("#notebookOverlay").addEventListener("click", toggleNotebook);
    
    if ($("#nbClearAll")) {
      $("#nbClearAll").addEventListener("click", () => {
        if (confirm("모든 메모와 용의자 지목을 초기화하시겠습니까?")) {
          playersData.forEach(p => { p.memo = ""; p.isSuspect = false; });
          renderNotebookCards(); showSaveStatus();
        }
      });
    }

    if ($("#topicConfirmBtn")) {
      $("#topicConfirmBtn").addEventListener("click", () => {
        $("#topicModal").classList.add("hidden");
      });
    }

    if ($("#voteConfirmBtn")) {
      $("#voteConfirmBtn").addEventListener("click", () => {
        const selected = document.querySelector('input[name="voteTarget"]:checked');
        if (!selected) return alert("투표할 플레이어를 선택해주세요!");
        $("#voteModal").classList.add("hidden");
        const targetSlot = parseInt(selected.value);
        pendingVoteTarget = playersData[targetSlot - 1]; 
        setText("#confirmTargetName", pendingVoteTarget.name);
        $("#confirmExecuteModal").classList.remove("hidden");
      });
    }

    if ($("#cancelExecuteBtn")) {
      $("#cancelExecuteBtn").addEventListener("click", () => {
        $("#confirmExecuteModal").classList.add("hidden");
        $("#voteModal").classList.remove("hidden");
      });
    }

    if ($("#doExecuteBtn")) {
      $("#doExecuteBtn").addEventListener("click", () => {
        $("#confirmExecuteModal").classList.add("hidden");
        const indicator = $("#turn-indicator");
        indicator.classList.add("last-word-mode");
        setText("#turn-player-name", pendingVoteTarget.name);
        setText("#turn-indicator .turn-label", "LAST WORDS (10s)");
        let lastWordTime = 10;
        $("#timerWrap").classList.remove("hidden");
        setText("#timerDisplay", lastWordTime);
        freeTalkTimerInterval = setInterval(() => {
          lastWordTime--;
          setText("#timerDisplay", lastWordTime);
          if (lastWordTime <= 0) {
            clearInterval(freeTalkTimerInterval);
            $("#timerWrap").classList.add("hidden");
            indicator.classList.remove("last-word-mode");
            setText("#finalDecisionTargetName", pendingVoteTarget.name);
            $("#finalDecisionModal").classList.remove("hidden");
          }
        }, 1000);
      });
    }

    if ($("#btnSpare")) {
      $("#btnSpare").addEventListener("click", () => {
        $("#finalDecisionModal").classList.add("hidden");
        window.WSClient.submitVote(null); 
      });
    }
    
    if ($("#btnExecute")) {
      $("#btnExecute").addEventListener("click", () => {
        $("#finalDecisionModal").classList.add("hidden");
        window.WSClient.submitVote(pendingVoteTarget.id);
      });
    }

    if ($("#verdictConfirmBtn")) {
      $("#verdictConfirmBtn").addEventListener("click", () => {
        $("#verdictModal").classList.add("hidden");
        setText("#turn-indicator .turn-label", "NOW SPEAKING");
      });
    }

    if ($("#resultBackBtn")) {
      $("#resultBackBtn").addEventListener("click", () => { location.href = "index.html"; });
    }

    renderNotebookCards();
  });

})();