const startBtn = document.getElementById("startBtn");
const howBtn = document.getElementById("howBtn");
const settingBtn = document.getElementById("settingBtn");

const howModal = document.getElementById("howModal");
const settingModal = document.getElementById("settingModal");

const closeBtns = document.querySelectorAll(".close-btn");

startBtn.addEventListener("click", () => {
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

        howModal.classList.add("hidden");
        settingModal.classList.add("hidden");

    });

});
