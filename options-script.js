function setGreetingMsg() {
  document.getElementsByClassName(
    "fname_soci"
  )[0].innerText = localStorage.getItem("firstName");
}

// handles dash event
function dashEvent() {
  location.href =
    "chrome-extension://dajhlgeppahilcjfammljcfneapcfckn/dashboard.html";
}

// Global Event Listeners
document
  .getElementsByClassName("dash-link")[0]
  .addEventListener("click", dashEvent);

// Global Fns Control
setGreetingMsg();
