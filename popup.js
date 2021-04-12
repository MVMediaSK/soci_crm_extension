// Handle bored
function loginReq() {
  console.log("Axios Login Event");
  axios
    .post("http://localhost:3000/users/login", {
      email: localStorage.getItem("email"),
      password: localStorage.getItem("password"),
    })
    .then(function (res) {
      console.log(res);
      if (res.data.status === 200) {
        console.log("OK");
        if (res.data.key) {
          localStorage.removeItem("key");
          localStorage.setItem("jwt_token", res.data.key);
        }
        if (res.data.userData._id) {
          localStorage.removeItem("userID");
          localStorage.setItem("userID", res.data.userData._id);
        }
        if (res.data.userData.firstName) {
          localStorage.removeItem("firstName");
          localStorage.setItem("firstName", res.data.userData.firstName);
        }
        if (res.data.userData.lastName) {
          localStorage.removeItem("lastName");
          localStorage.setItem("lastName", res.data.userData.lastName);
        }
        location.href =
          "chrome-extension://dajhlgeppahilcjfammljcfneapcfckn/options.html";
      } else if (res.data.status === 500) {
        document.getElementsByClassName("soci_login_err")[0].innerText +=
          "Invalid Username/Password";
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

function saveToLocalStorage() {
  console.log("Creds Saved to LS");
  let email_soci = document.querySelector("#email").value;
  let pass_soci = document.querySelector("#password").value;
  if (email_soci) {
    localStorage.removeItem("email");
    localStorage.setItem("email", email_soci);
  }
  if (pass_soci) {
    localStorage.removeItem("password");
    localStorage.setItem("password", pass_soci);
  }
  loginReq();
}

function checkLCStorage() {
  if (localStorage.email && localStorage.password) {
    document.querySelector("#email").value = localStorage.getItem("email");
    document.querySelector("#password").value = localStorage.getItem(
      "password"
    );
    document.querySelector("#submit_soci").click();
  }
}

function redirectToFB() {
  window.open("https://facebook.com", "_blank");
}

function redirectToMsngr() {
  window.open("https://messenger.com", "_blank");
}

// Global Event Listeners
document
  .querySelector("#submit_soci")
  .addEventListener("click", saveToLocalStorage);

document
  .getElementsByClassName("facebook_soci")[0]
  .addEventListener("click", redirectToFB);

document
  .getElementsByClassName("messenger_soci")[0]
  .addEventListener("click", redirectToMsngr);

// Global Function Controls
checkLCStorage();
