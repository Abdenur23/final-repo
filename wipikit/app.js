const App = (() => {
  const init = () => {
    setupModal();
  };

  const setupModal = () => {
    const openBtn = document.getElementById("openBooking");
    const modal = document.getElementById("bookingModal");
    const closeBtn = document.getElementById("closeModal");

    openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
    window.addEventListener("click", e => { if(e.target === modal) modal.classList.add("hidden"); });
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
