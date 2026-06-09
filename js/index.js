const startBtn = document.getElementById("startBtn");
const howBtn = document.getElementById("howBtn");
const settingBtn = document.getElementById("settingBtn");

const howModal = document.getElementById("howModal");
const settingModal = document.getElementById("settingModal");

const closeBtns = document.querySelectorAll(".close-btn");

const modeModal = document.getElementById("modeModal");
const soloModeBtn = document.getElementById("soloModeBtn");
const multiModeBtn = document.getElementById("multiModeBtn");

startBtn.addEventListener("click", () => {
    modeModal.classList.remove("hidden");
});

soloModeBtn.addEventListener("click", () => {
    sessionStorage.setItem("gameMode", "solo");
    location.href = "game.html";
});

multiModeBtn.addEventListener("click", () => {
    sessionStorage.setItem("gameMode", "group");
    location.href = "game.html";
});

howBtn.addEventListener("click", () => {
    howModal.classList.remove("hidden");
});

settingBtn.addEventListener("click", () => {
    settingModal.classList.remove("hidden");
});

closeBtns.forEach(btn => {

    btn.addEventListener("click", () => {

        modeModal.classList.add("hidden");
        howModal.classList.add("hidden");
        settingModal.classList.add("hidden");

    });

});
