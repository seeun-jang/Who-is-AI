// js/ws.js
// WebSocket 서버 연결 및 라운드 전환 시 UI 완벽 초기화 추가

(function () {
  const WS_URL = "ws://nextwave.aikopo.net/ai-mafia/ws?mode=group";

  let socket = null;
  let typingTimer = null;
  let chatMode = "experience"; 
  let currentTurnPlayerId = null; 

  function connectWebSocket() {
    socket = new WebSocket(WS_URL);
    socket.addEventListener("open", () => console.log("🟢 WebSocket 연결 성공!"));
    socket.addEventListener("message", (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch (error) { return; }
      console.log("📥 [서버 수신]:", message.type, message.data);
      handleServerMessage(message);
    });
  }

  function sendToServer(type, data = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: type, data: data }));
    console.log("📤 [서버 송신]:", type, data);
  }

  function handleServerMessage(message) {
    const type = message.type;
    const data = message.data || {};

    switch (type) {
      case "connected":
        if (window.UIRender && window.UIRender.setMyPlayerId) window.UIRender.setMyPlayerId(data.player_id || data.id);
        break;
      case "waiting_room":
        window.UIRender.showWaitingRoom(data.current || data.waiting_count || 0, data.required || 5, data.message || "");
        break;
      case "game_start":
        window.UIRender.hideWaitingRoom();
        if (Array.isArray(data.players)) window.UIRender.updatePlayerNames(data.players);
        break;
        
      // ★ 핵심 수정: 새 라운드가 시작되면 UI의 모든 잡다한 상태를 물청소(Reset) 한다!
      case "round_start":
        chatMode = "experience";
        if (window.UIRender && window.UIRender.resetPhase) window.UIRender.resetPhase();
        window.UIRender.updateKeyword(data.prompt_word || data.keyword || "");
        break;
        
      case "turn_start":
      case "experience_request":
        chatMode = "experience";
        currentTurnPlayerId = data.current_player_id || data.player_id;
        if (window.UIRender) window.UIRender.showCurrentTurn(currentTurnPlayerId, data.timeout || 60);
        break;
        
      case "experience_submitted":
      case "chat_message":
        window.UIRender.showPlayerBubble(data.player_id || data.id, data.content || data.message);
        break;
      case "free_chat_start":
        chatMode = "free_chat";
        window.UIRender.showFreeTalkStart(data.duration || 60);
        break;
      case "typing_status":
        window.UIRender.showTypingStatus(data.player_id || data.id, data.is_typing);
        break;
      case "judge_result":
      case "vote_result":
        window.UIRender.showVerdictResult(data);
        break;
      case "vote_start":
        window.UIRender.showVoteStart();
        break;
      case "game_over":
        window.UIRender.showGameOver(data);
        break;
    }
  }

  function submitExperience(content) { sendToServer("submit_experience", { content: content }); }
  function sendChat(content) { sendToServer("send_chat", { content: content }); }
  function sendTypingStatus(isTyping) { sendToServer("typing_status", { is_typing: isTyping }); }
  function submitVote(votedPlayerId) { sendToServer("submit_vote", { voted_player_id: votedPlayerId }); }

  function bindChatInput() {
    const chatInput = document.querySelector("#chatInput");
    const sendButton = document.querySelector("#sendBtn");
    if (!chatInput) return;

    window.sendMessage = () => { console.warn("옛날 sendMessage 무시"); };

    function submitMessage(e) {
      if (e) {
        e.preventDefault();
        e.stopImmediatePropagation(); 
      }
      
      const content = chatInput.value.trim();
      if (!content) return;

      if (chatMode === "experience" && window.UIRender) {
        const myId = window.UIRender.getMyPlayerId ? window.UIRender.getMyPlayerId() : null;
        if (myId && currentTurnPlayerId && myId !== currentTurnPlayerId) {
          alert("❌ 아직 당신의 차례가 아닙니다! 상단의 'NOW SPEAKING' 차례를 기다려주세요.");
          return;
        }
      }

      console.log(`🚀 텍스트 전송 완료: [${content}]`);
      if (chatMode === "experience") submitExperience(content);
      else sendChat(content);

      if (window.UIRender) {
        const myId = window.UIRender.getMyPlayerId ? window.UIRender.getMyPlayerId() : null;
        if (myId) window.UIRender.showPlayerBubble(myId, content);
      }

      chatInput.value = "";
      sendTypingStatus(false);
    }

    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) submitMessage(event);
    }, true); 

    chatInput.addEventListener("input", () => {
      sendTypingStatus(true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => { sendTypingStatus(false); }, 1000);
    });

    if (sendButton) sendButton.addEventListener("click", submitMessage, true);
  }

  function init() {
    connectWebSocket();
    bindChatInput();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.WSClient = { sendToServer, submitExperience, sendChat, sendTypingStatus, submitVote };
})();