// ws.js
// WebSocket 서버 연결 및 이벤트 처리

(function () {
  const WS_URL = "ws://nextwave.aikopo.net/ai-mafia/ws?mode=group";

  let socket = null;
  let typingTimer = null;
  let chatMode = "experience"; 
  // experience: 차례대로 경험담 제출
  // free_chat: 자유 채팅

  function connectWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.addEventListener("open", () => {
      console.log("WebSocket 연결 성공");
    });

    socket.addEventListener("message", (event) => {
      let message;

      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.error("서버 메시지 JSON 변환 실패:", event.data);
        return;
      }

      console.log("서버에서 받은 메시지:", message);
      handleServerMessage(message);
    });

    socket.addEventListener("close", () => {
      console.log("WebSocket 연결 종료");
    });

    socket.addEventListener("error", (error) => {
      console.error("WebSocket 에러:", error);
    });
  }

  function sendToServer(type, data = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket이 아직 연결되지 않았습니다.");
      return;
    }

    socket.send(JSON.stringify({
      type: type,
      data: data
    }));
  }

  function handleServerMessage(message) {
    const type = message.type;
    const data = message.data || {};

    switch (type) {
      case "connected":
        console.log("내 접속 정보:", data);
        break;

      case "waiting_room":
        handleWaitingRoom(data);
        break;

      case "game_start":
        handleGameStart(data);
        break;

      case "round_start":
        handleRoundStart(data);
        break;

      case "turn_start":
        handleTurnStart(data);
        break;

      case "experience_request":
        handleExperienceRequest(data);
        break;

      case "experience_submitted":
        handleExperienceSubmitted(data);
        break;

      case "experience_timeout":
        console.log("경험담 제출 시간 초과:", data);
        break;

      case "free_chat_start":
        handleFreeChatStart(data);
        break;

      case "chat_message":
        handleChatMessage(data);
        break;

      case "typing_status":
        handleTypingStatus(data);
        break;

      case "judge_result":
        window.UIRender.showJudgeResult(data);
        break;

      case "vote_start":
        console.log("투표 시작:", data);
        // 투표 기능은 현재 제외
        break;

      case "vote_result":
        console.log("투표 결과:", data);
        // 투표 기능은 현재 제외
        break;

      case "game_over":
        window.UIRender.showGameOver(data);
        break;

      default:
        console.log("아직 처리하지 않은 서버 이벤트:", type, data);
    }
  }

  function handleWaitingRoom(data) {
    const current =
      data.current ||
      data.waiting_count ||
      data.count ||
      0;

    const required =
      data.required ||
      data.required_count ||
      5;

    const message =
      data.message ||
      "";

    window.UIRender.showWaitingRoom(current, required, message);
  }

  function handleGameStart(data) {
    window.UIRender.hideWaitingRoom();

    if (Array.isArray(data.players)) {
      window.UIRender.updatePlayerNames(data.players);
    }

    console.log("게임 시작:", data);
  }

  function handleRoundStart(data) {
    chatMode = "experience";

    const keyword =
      data.prompt_word ||
      data.keyword ||
      data.topic ||
      data.word ||
      "";

    window.UIRender.updateKeyword(keyword);

    console.log("라운드 시작:", data);
  }

  function handleTurnStart(data) {
    const currentPlayerId =
      data.current_player_id ||
      data.player_id ||
      data.playerId;

    const timeout =
      data.timeout ||
      60;

    window.UIRender.showCurrentTurn(currentPlayerId, timeout);
  }

  function handleExperienceRequest(data) {
    chatMode = "experience";
    console.log("경험담 입력 요청:", data);
  }

  function handleExperienceSubmitted(data) {
    const playerId =
      data.player_id ||
      data.playerId ||
      data.id;

    const content =
      data.content ||
      data.message ||
      "";

    window.UIRender.showPlayerBubble(playerId, content);
  }

  function handleFreeChatStart(data) {
    chatMode = "free_chat";

    window.UIRender.showFreeTalkStart();

    console.log("자유 채팅 시작:", data);
  }

  function handleChatMessage(data) {
    const playerId =
      data.player_id ||
      data.playerId ||
      data.id;

    const content =
      data.content ||
      data.message ||
      "";

    window.UIRender.showPlayerBubble(playerId, content);
  }

  function handleTypingStatus(data) {
    const playerId =
      data.player_id ||
      data.playerId ||
      data.id;

    const isTyping =
      data.is_typing ||
      data.isTyping ||
      false;

    window.UIRender.showTypingStatus(playerId, isTyping);
  }

  function submitExperience(content) {
    sendToServer("submit_experience", {
      content: content
    });
  }

  function sendChat(content) {
    sendToServer("send_chat", {
      content: content
    });
  }

  function sendTypingStatus(isTyping) {
    sendToServer("typing_status", {
      is_typing: isTyping
    });
  }

  function submitVote(votedPlayerId) {
    sendToServer("submit_vote", {
      voted_player_id: votedPlayerId
    });
  }

  function bindChatInput() {
    const chatInput = document.querySelector("#chatInput");
    const sendButton = document.querySelector("#sendBtn");

    if (!chatInput) {
      console.warn("chatInput을 찾지 못했습니다.");
      return;
    }

    function submitMessage() {
      const content = chatInput.value.trim();

      if (!content) return;

      if (chatMode === "experience") {
        submitExperience(content);
      } else {
        sendChat(content);
      }

      chatInput.value = "";
      sendTypingStatus(false);
    }

    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitMessage();
      }
    });

    chatInput.addEventListener("input", () => {
      sendTypingStatus(true);

      clearTimeout(typingTimer);

      typingTimer = setTimeout(() => {
        sendTypingStatus(false);
      }, 1000);
    });

    if (sendButton) {
      sendButton.addEventListener("click", submitMessage);
    }
  }

  function init() {
    connectWebSocket();
    bindChatInput();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.WSClient = {
    sendToServer,
    submitExperience,
    sendChat,
    sendTypingStatus,
    submitVote
  };
})();
