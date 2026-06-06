// ui-render.js
// 서버에서 받은 데이터를 현재 game.html 화면에 표시하는 함수들

(function () {
  const playerSlotById = new Map();

  function $(selector) {
    return document.querySelector(selector);
  }

  function setText(selector, text) {
    const element = $(selector);
    if (element) {
      element.textContent = text ?? "";
    }
  }

  function getPlayerSlot(playerIdOrSlot) {
    if (playerIdOrSlot === null || playerIdOrSlot === undefined) {
      return null;
    }

    const value = String(playerIdOrSlot);

    // 1, 2, 3, 4, 5 형태
    if (/^[1-5]$/.test(value)) {
      return Number(value);
    }

    // Player1, player_1, player-1 형태
    const match = value.match(/player[_-]?([1-5])/i);
    if (match) {
      return Number(match[1]);
    }

    // 서버에서 받은 실제 player_id를 슬롯 번호로 변환
    if (playerSlotById.has(value)) {
      return playerSlotById.get(value);
    }

    return null;
  }

  function getPlayerNameBySlot(slot) {
    const tag = $(`.player-tag.player-${slot}`);
    return tag ? tag.textContent : `Player ${slot}`;
  }

  // game_start 이벤트에서 받은 플레이어 목록 표시
  function updatePlayerNames(players) {
    console.log("플레이어 닉네임 표시:", players);

    playerSlotById.clear();

    if (!Array.isArray(players)) return;

    players.slice(0, 5).forEach((player, index) => {
      const slot = index + 1;

      const playerId =
        player.id ||
        player.player_id ||
        player.playerId;

      const nickname =
        player.nickname ||
        `Player ${slot}`;

      if (playerId) {
        playerSlotById.set(String(playerId), slot);
      }

      // 아래 책 위의 Player 태그 변경
      setText(`.player-tag.player-${slot}`, nickname);

      // 말풍선 위 Player 이름 변경
      setText(`.bubble-${slot} .bubble-header`, nickname);
    });
  }

  // round_start 이벤트에서 받은 제시어 표시
  function updateKeyword(keyword) {
    console.log("제시어 표시:", keyword);

    // 왼쪽 위 topic-board
    setText("#topicHeaderText", keyword || "제시어");

    // 제시어 공개 모달 안의 텍스트
    setText("#topicText", keyword || "제시어 불러오는 중...");

    // 라운드가 시작됐을 때만 제시어 모달 보여주기
    const topicModal = $("#topicModal");
    if (topicModal) {
      topicModal.classList.remove("hidden");
    }
  }

  // 채팅이나 경험담을 말풍선에 표시
  function showPlayerBubble(playerId, content) {
    const slot = getPlayerSlot(playerId);

    console.log("말풍선 표시:", {
      playerId,
      slot,
      content
    });

    if (!slot) {
      console.warn("플레이어 슬롯을 찾지 못했습니다:", playerId);
      return;
    }

    const bubble = $(`.bubble-${slot}`);
    const bubbleBody = $(`.bubble-${slot} .bubble-body`);

    if (bubbleBody) {
      bubbleBody.textContent = content || "";
    }

    if (bubble) {
      bubble.classList.add("active");
      bubble.style.display = "block";
    }
  }

  // waiting_room 이벤트에서 대기 모달 표시
  function showWaitingRoom(current, required, message) {
    console.log(`대기방 표시: ${current}/${required}`, message);

    // 대기 중일 때는 제시어 모달 숨기기
    const topicModal = $("#topicModal");
    if (topicModal) {
      topicModal.classList.add("hidden");
    }

    const waitingModal = $("#waitingModal");

    if (waitingModal) {
      waitingModal.classList.remove("hidden");
    }

    setText(".waiting-status", `WAITING... ${current}/${required}`);

    const waitingPanelText = $("#waitingModal .waiting-panel p");
    if (waitingPanelText) {
      waitingPanelText.textContent =
        message || `플레이어를 기다리는 중입니다. (${current}/${required})`;
    }
  }

  // game_start 이벤트에서 대기 모달 닫기
  function hideWaitingRoom() {
    console.log("대기방 닫기");

    const waitingModal = $("#waitingModal");

    if (waitingModal) {
      waitingModal.classList.add("hidden");
    }
  }

  // turn_start 이벤트에서 현재 말하는 플레이어 표시
  function showCurrentTurn(playerId, timeout) {
    const slot = getPlayerSlot(playerId);
    const playerName = slot ? getPlayerNameBySlot(slot) : "Player";

    console.log("현재 턴:", {
      playerId,
      slot,
      timeout
    });

    setText("#turn-player-name", playerName);

    const timerWrap = $("#timerWrap");
    if (timerWrap) {
      timerWrap.classList.remove("hidden");
    }

    setText("#timerDisplay", timeout || 60);
  }

  // free_chat_start 이벤트에서 자유 토론 모달 표시
  function showFreeTalkStart() {
    console.log("자유 토론 시작");

    const modal = $("#freeTalkModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  // typing_status는 지금은 콘솔 확인만
  function showTypingStatus(playerId, isTyping) {
    const slot = getPlayerSlot(playerId);

    console.log("타이핑 상태:", {
      playerId,
      slot,
      isTyping
    });
  }

  // judge_result는 지금은 콘솔 확인만
  function showJudgeResult(data) {
    console.log("AI 판정 결과:", data);
  }

  // game_over 이벤트에서 결과 모달 표시
  function showGameOver(data) {
    console.log("게임 종료:", data);

    const resultModal = $("#resultModal");

    if (resultModal) {
      resultModal.classList.remove("hidden");
    }

    setText("#resultTitle", "GAME OVER");

    if (data && data.winner) {
      setText("#resultStamp", `${data.winner} WIN`);
    }

    if (data && data.message) {
      setText("#resultDesc", data.message);
    } else {
      setText("#resultDesc", "게임이 종료되었습니다.");
    }
  }

  window.UIRender = {
    updatePlayerNames,
    updateKeyword,
    showPlayerBubble,
    showWaitingRoom,
    hideWaitingRoom,
    showCurrentTurn,
    showFreeTalkStart,
    showTypingStatus,
    showJudgeResult,
    showGameOver
  };
})();
