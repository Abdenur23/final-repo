const BookingModule = (() => {
  const init = () => {
    const form = document.getElementById("bookingForm");
    form.addEventListener("submit", handleSubmit);
  };

  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      name: formData.get("name"),
      address: formData.get("address"),
      neighborhood: formData.get("neighborhood"),
      timeSlot: formData.get("timeSlot")
    };

    console.log("Booking Data:", data);
    showThankYou();
  };

  const showThankYou = () => {
    document.getElementById("bookingForm").classList.add("hidden");
    document.getElementById("thankYou").classList.remove("hidden");
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", BookingModule.init);
