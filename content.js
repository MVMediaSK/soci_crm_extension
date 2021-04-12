var globalEventArr = ["msg", "msg_edited"];
let keysPressed = {};

// check 1
console.log("Chrome Ext Go");
// modify getDataStorage to check for the key presence
function getDataStorage(key_to_fetch) {
  if (localStorage.getItem("soci_crm_jwt_token") === null) {
    refreshUserToken().then(function () {
      console.log(key_to_fetch, "lc storage key");
      if (localStorage.getItem("soci_crm_jwt_token")) {
        notifySuccess("Token");
        return localStorage.getItem(key_to_fetch);
      } else {
        notifyError("Error", "Token cannot be refreshed");
        return localStorage.getItem(key_to_fetch);
      }
    });
  } else {
    return localStorage.getItem(key_to_fetch);
  }
}

// Refresh User Token
function refreshUserToken() {
  return new Promise(function (resolve, reject) {
    chrome.extension.sendMessage(
      { message: "get_logged_in_user" },
      function (res) {
        console.log(res.data);
        if (res.data !== null) {
          var { email, firstName, jwt_token, lastName, userID } = res.data;
          // If User is present, set following data to site's local storage
          // sanitising local storage before setting data to it
          localStorage.removeItem("soci_crm_jwt_token");
          localStorage.removeItem("soci_crm_firstName");
          localStorage.removeItem("soci_crm_lastName");
          localStorage.removeItem("soci_crm_userID");

          // sets items from bg script to localStorage
          localStorage.setItem("soci_crm_jwt_token", jwt_token);
          localStorage.setItem("soci_crm_firstName", firstName);
          localStorage.setItem("soci_crm_lastName", lastName);
          localStorage.setItem("soci_crm_userID", userID);
        }
        resolve();
      }
    );
  });
}

// refresh user token on first visit or reload
function refresher_async(cb_fn) {
  refreshUserToken().then(function () {
    notifySuccess("Token");
    cb_fn ? cb_fn() : console.log("SociCRM Warning : No Callback fn found");
  });
}

// Injecting Unsafe content headers
document.head.innerHTML += `<meta http-equiv="Content-Security-Policy" content="script-src * data: https://cdnjs.cloudflare.com/* 'unsafe-inline' 'unsafe-eval';" />`;

// Determines which function to add based on localStorage Value
localStorage.display_dash === "true"
  ? get_disp_dash_from_lc()
  : injectFltngBtn();

// Determines which function to add based on localStorage Value
localStorage.display_dash === "true"
  ? setTimeout(function () {
      addContactFb();
    }, 2000)
  : console.log(
      "WARNING - SOCICRM: NOT ADDING CONTACT MARKINGS AS DISP_DASH IS FALSE/UNDEFINED"
    );

// Function which injects floating btn
function injectFltngBtn() {
  var soci_url = chrome.extension.getURL("./floating_btn/floating_btn.html");
  axios.get(soci_url).then((res) => {
    var inject = document.createElement("div");
    inject.innerHTML = res.data;
    document.body.insertBefore(inject, document.body.firstChild);
    var fltng_btn = document.getElementsByClassName("float")[0];
    fltng_btn.addEventListener("click", function () {
      refresher_async();
      handleFltngBtnClick();
    });
  });
}

// function which injects dashboard into the view
function injectDash() {
  localStorage.setItem("display_dash", "true");
  var dash_url = chrome.extension.getURL("./dashboard/index.html");
  axios.get(dash_url).then((res) => {
    document.body.className += " collapsed";
    var inject = document.createElement("div");
    inject.innerHTML = res.data;
    document.body.insertBefore(inject, document.body.firstChild);
    const html = document.documentElement;
    const body = document.body;
    const menuLinks = document.querySelectorAll(".admin-menu a");
    const collapseBtn = document.querySelector(".admin-menu .collapse-btn");
    const toggleMobileMenu = document.querySelector(".toggle-mob-menu");
    const switchInput = document.querySelector(".switch input");
    const switchLabel = document.querySelector(".switch label");
    const switchLabelText = switchLabel.querySelector("span:last-child");
    const collapsedClass = "collapsed";
    const lightModeClass = "light-mode";
    var userFirstName = getDataStorage("soci_crm_firstName");
    var userJwtToken = getDataStorage("soci_crm_jwt_token");
    var userID = getDataStorage("soci_crm_userID");

    /* ADD EVENT LISTENER FOR MOUSE EVENTS */
    console.log("Adding Keyboard Events");
    notifySuccess("Keyboard Events");
    document.addEventListener("keydown", (e) => {
      console.log(e.target.ariaLabel === "Aa");
      if (e.target.ariaLabel === "Aa" && e.keyCode === 38) {
        handleKeyboardEvent(e);
      }
    });

    /*IF FIRST NAME IS PRESENT, ADD IT TO THE DASHBOARD PAGE*/
    if (userFirstName) {
      changeUserNameOnDash(userFirstName);
    }

    /* ADD LOGOUT EVENT LISTENER */
    document
      .getElementsByClassName("logout_btn")[0]
      .addEventListener("click", handleLogout);

    /* Block1 in Variable*/

    /* SHOW BLOCK1 when message is clicked & IF JWT TOKEN IS PRESENT, FETCH USER MESSAGES */
    var msg_dash_elem = document.querySelectorAll("#messages")[0];
    msg_dash_elem.addEventListener("click", function () {
      // alert("clicked");
      fetchUserMessages(userJwtToken, userID);
      showPageContent("100%");
      showBlockOne();
    });

    /* SHOW BLOCK1 when message category is clicked & IF JWT TOKEN IS PRESENT, FETCH USER MESSAGES */
    var msg__cat_dash_elem = document.querySelectorAll("#message_cat")[0];
    msg__cat_dash_elem.addEventListener("click", function () {
      // alert("clicked");
      fetchUserMsgCat(userJwtToken, userID);
      showPageContent("100%");
      showBlockOne();
    });

    /* SHOW BLOCK1 when contact is clicked & IF JWT TOKEN IS PRESENT, FETCH USER MESSAGES */
    var cntct_dash_elem = document.querySelectorAll("#contacts")[0];
    cntct_dash_elem.addEventListener("click", function () {
      // alert("clicked");
      refreshUserToken().then(function () {
        fetchUserContacts();
      });
      // fetchUserContacts();
      showPageContent("100%");
      showBlockOne();
      removeGrid();
    });

    /*TOGGLE HEADER STATE*/
    collapseBtn.addEventListener("click", function () {
      body.classList.toggle(collapsedClass);
      hidePageContent();
      this.getAttribute("aria-expanded") == "true"
        ? this.setAttribute("aria-expanded", "false")
        : this.setAttribute("aria-expanded", "true");
      this.getAttribute("aria-label") == "collapse menu"
        ? this.setAttribute("aria-label", "expand menu")
        : this.setAttribute("aria-label", "collapse menu");
    });

    /*TOGGLE MOBILE MENU*/
    toggleMobileMenu.addEventListener("click", function () {
      body.classList.toggle("mob-menu-opened");
      this.getAttribute("aria-expanded") == "true"
        ? this.setAttribute("aria-expanded", "false")
        : this.setAttribute("aria-expanded", "true");
      this.getAttribute("aria-label") == "open menu"
        ? this.setAttribute("aria-label", "close menu")
        : this.setAttribute("aria-label", "open menu");
    });

    /*SHOW TOOLTIP ON MENU LINK HOVER*/
    for (const link of menuLinks) {
      link.addEventListener("mouseenter", function () {
        if (
          body.classList.contains(collapsedClass) &&
          window.matchMedia("(min-width: 768px)").matches
        ) {
          const tooltip = this.querySelector("span").textContent;
          this.setAttribute("title", tooltip);
        } else {
          this.removeAttribute("title");
        }
      });
    }

    /*TOGGLE LIGHT/DARK MODE*/
    if (getDataStorage("dark-mode") === "false") {
      html.classList.add(lightModeClass);
      switchInput.checked = false;
      switchLabelText.textContent = "Light";
    }

    switchInput.addEventListener("input", function () {
      html.classList.toggle(lightModeClass);
      if (html.classList.contains(lightModeClass)) {
        switchLabelText.textContent = "Light";
        localStorage.setItem("dark-mode", "false");
      } else {
        switchLabelText.textContent = "Dark";
        localStorage.setItem("dark-mode", "true");
      }
    });
  });
}

/*Injects margins to facebook's layout to make space for extension sidebar*/
function injectMarginOnFbNavigation() {
  var arrOfNavRoles = document.querySelectorAll('[role="navigation"]')[2];
  var arrOfTopDiv = document
    .querySelectorAll('[role="banner"]')[0]
    .getElementsByTagName("div")[0];
  arrOfNavRoles
    ? (arrOfNavRoles.style.margin = "0 30px")
    : console.log(
        "Warning: FB Nav Not Found to inject margin @ SociCRM - body column layout"
      );
  arrOfTopDiv
    ? (arrOfTopDiv.style.marginLeft = "50px")
    : console.log(
        "Warning: FB Div Not Found to inject margin @ SociCRM - top header layout"
      );
}

// function to handle onClick of a floating button
function handleFltngBtnClick() {
  document.getElementsByClassName("float")[0].style.display = "none";
  addContactFb();
  injectDash();
  injectMarginOnFbNavigation();
}

// injecting dashboard & margin to FB Site
function loadDashOverRideFltngBtn() {
  injectDash();
  injectMarginOnFbNavigation();
}

// function to handle auto display of dashboard if present in localStorage
function get_disp_dash_from_lc() {
  localStorage.display_dash === "true"
    ? loadDashOverRideFltngBtn()
    : console.log(
        "Info: Disp Dash Not Found or is set to False, thus not displaying dashboard"
      );
}

// function to change name of user on dashboard
function changeUserNameOnDash(userName) {
  var userNameBlock = document.querySelectorAll(".user_first_name");
  if (userNameBlock) return (userNameBlock[0].innerHTML = userName);
}

// function to fetch user's messages from db
var fetchUserMessages = (userJwtToken, userId) => {
  userJwtToken
    ? userJwtToken
    : (userJwtToken = getDataStorage("soci_crm_jwt_token"));
  userId ? userId : (userId = getDataStorage("soci_crm_userID"));
  axios
    .get(`http://localhost:3000/api/v1/message/user/${userId}`, {
      headers: {
        Authorization: `${userJwtToken}`,
      },
    })
    .then((res) => {
      console.log(res.data.messages);
      var user_msgs = res.data.messages;
      createMsgCards(user_msgs);
    })
    .catch((err) => {
      console.error(err);
    });
};

// function to hide page-content completely
var hidePageContent = () => {
  var pgContent = document.getElementsByClassName("page-content")[0].style;
  pgContent.style = {
    height: "0px",
    opacity: "0",
    display: "none",
    zIndex: "0",
  };
};

var showPageContent = (width_of_page) => {
  var pgContent = document.getElementsByClassName("page-content")[0].style;
  pgContent.height = "100vh";
  pgContent.opacity = "1";
  pgContent.display = "block";
  pgContent.zIndex = "1";
  pgContent.width = width_of_page;
};

var hidePageContent = () => {
  var pgContent = document.getElementsByClassName("page-content")[0].style;
  pgContent.height = "0vh";
  pgContent.opacity = "0";
  pgContent.display = "none";
  pgContent.zIndex = "0";
  pgContent.position = "fixed";
};

var showBlockOne = (width) => {
  var pgContent = document.getElementsByClassName("soci_crm_block_1")[0].style;
  pgContent.height = "100vh";
  pgContent.opacity = "1";
  pgContent.display = "block";
  pgContent.zIndex = "1";
  width ? (pgContent.width = width) : (pgContent.width = "100%");
};

var showBlockTwo = (width) => {
  var pgContent = document.getElementsByClassName("soci_crm_block_2")[0].style;
  pgContent.height = "100vh";
  pgContent.opacity = "1";
  pgContent.display = "block";
  pgContent.zIndex = "1";
  width ? (pgContent.width = width) : (pgContent.width = "100%");
};

var hideBlockTwo = () => {
  var pgContent = document.getElementsByClassName("soci_crm_block_2")[0].style;
  pgContent.height = "0vh";
  pgContent.opacity = "0";
  pgContent.display = "none";
  pgContent.zIndex = "0";
  pgContent.width = "0";
};

// Create Message Card from API Datas
var createMsgCards = (msg_arr) => {
  console.log(msg_arr, "msg_arr");
  var soci_url = chrome.extension.getURL(
    "./dashboard/components/msgCards.html"
  );
  axios.get(soci_url).then((res) => {
    var msg_generated_html = "";
    var parser = new DOMParser();
    var msgCardHtml = parser.parseFromString(res.data, "text/html");

    for (msgData in msg_arr) {
      var msgTitle = msg_arr[msgData].title;
      var msgId = msg_arr[msgData]._id;
      var catId = msg_arr[msgData].cat_id;
      var createdAt = msg_arr[msgData].createdAt;
      // Set proper classnames with proper ids for event listeners
      msgCardHtml.getElementsByClassName(
        "soci_msg_cards"
      )[0].className = `soci_msg_cards ${msgId}`;
      msgCardHtml.getElementsByClassName(
        "soci_heading"
      )[0].className = `soci_heading soci_msg_heading ${msgId}`;
      // Set Proper Values to elements
      msgCardHtml
        .getElementsByClassName("soci_msg_cards")[0]
        .getElementsByClassName("soci_msg_full")[0].innerText =
        createdAt + " " + catId;
      msgCardHtml
        .getElementsByClassName("soci_msg_cards")[0]
        .getElementsByClassName("soci_heading")[0].innerText = msgTitle;

      msg_generated_html += msgCardHtml.documentElement.innerHTML;
    }
    var html_to_send =
      '<h2 style="padding: 10px; color: #000000;" class ="section_head">Messages</h2><br/>';
    html_to_send += msg_generated_html;
    injectToBlockOne(html_to_send, "msg");
  });
};

// Fn takes HTML as arguement & injects it to the page
var injectToBlockOne = (html_to_inject, event_type) => {
  document.getElementsByClassName(
    "soci_crm_block_1"
  )[0].innerHTML = html_to_inject;
  if (event_type === "msg") return handleMsgEvents();
  if (event_type === "msgCat") return handleMsgCatEvents();
};

// Fn takes HTML as arguement & injects it to the page
var injectToBlockTwo = (html_to_inject, event_type) => {
  document.getElementsByClassName(
    "soci_crm_block_2"
  )[0].innerHTML = html_to_inject;
  if (event_type === "msg") return handleMsgEvents();
  if (event_type === "msgCat") return handleMsgCatEvents();
};

// Function to handle events for messages
var handleMsgEvents = () => {
  console.log("Info @ SociCRM : handleMsgEvents Ran");
  // add event on click of any message cards
  var allMsgCards = document.querySelectorAll(".soci_heading");
  allMsgCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      refresher_async(function () {
        handleMsgEdit(e);
      });
    });
  });
};

// handles Msg Edit Event
function handleMsgEdit(e) {
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var clickedMsgTitleClass = e.target.classList[2];
  console.log(
    "handle Event Ok",
    clickedMsgTitleClass ? clickedMsgTitleClass : "no event found"
  );
  axios
    .get(`http://localhost:3000/api/v1/message/${clickedMsgTitleClass}`, {
      headers: {
        Authorization: `${userJwtToken}`,
      },
    })
    .then((res) => {
      console.log(res.data.messages);
      var user_msg_to_edit = res.data.messages;
      injectMsgEditForm(user_msg_to_edit);
    })
    .catch((err) => {
      console.error(err);
    });
}

// Show Both cols equally
function showBothCols() {
  showBlockOne("100%");
  showBlockTwo("100%");
  addGrid();
}

// Show Only One Col
function showOneCols() {
  showBlockOne("100%");
  hideBlockTwo();
  removeGrid();
}

// add grid to show two cols
function addGrid() {
  document.getElementsByClassName("grid")[0].style.display = "grid";
}

// remove grid to show one col
function removeGrid() {
  document.getElementsByClassName("grid")[0].style.display = "block";
}

// Fetch & Inject Msg Edit Form
function injectMsgEditForm(msg_data_to_edit) {
  var soci_url = chrome.extension.getURL(
    "./dashboard/components/msgEditForm.html"
  );
  axios.get(soci_url).then((res) => {
    injectToBlockTwo(res.data);
    showBothCols();
    var msg_title = msg_data_to_edit.title;
    var msg_id = msg_data_to_edit._id;
    var cat_id = msg_data_to_edit.cat_id;
    document.querySelector("#msg_title").value = msg_title;
    document.querySelector("#msg_id").value = msg_id;
    document.querySelector("#msg_cat").value = cat_id;
    // Adds an Event on Save Btn Clicked
    document
      .querySelector("#submit_soci_msg_edit")
      .addEventListener("click", function () {
        refresher_async(updateMsgApi);
      });
  });
}

function updateMsgApi() {
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var msgID = document.querySelector("#msg_id").value;
  var msgTitle = document.querySelector("#msg_title").value;
  const hconfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${userJwtToken}`,
    },
  };
  var msg_obj = {
    title: `${msgTitle}`,
  };
  axios
    .put(`http://localhost:3000/api/v1/message/${msgID}`, msg_obj, hconfig)
    .then((res) => {
      console.log(res);
      showOneCols();
      notifySuccess("Message");
      fetchUserMessages();
    })
    .catch((err) => {
      console.log(err);
      notifyError("Invalid Token", "Something Went Wrong");
    });
}

// handle success(STATUS CODE_200) notifications events happening on DASHBOARD
function notifySuccess(updatedDataType) {
  var msgFront = "Updated ";
  var msgLast = updatedDataType ? updatedDataType : "Successfully";
  var msgToShow = msgFront + msgLast;
  iziToast.success({
    title: "Success",
    message: msgToShow,
    icon: "fas fa-check",
    position: "topRight",
  });
}

// handle success(STATUS CODE_200) notifications events happening on DASHBOARD
function notifyError(errTitle, errMsg) {
  iziToast.warning({
    title: errTitle,
    message: errMsg,
    icon: "fas fa-exclamation-triangle",
    position: "topRight",
  });
}

// Hides Sidebar & Revert the SociCRM Intro btn for the main logout fn
var hideMainSideBar = () => {
  document.getElementsByClassName("page-header")[0].style.display = "none";
  if (document.getElementsByClassName("float").length > 1) {
    document.getElementsByClassName("float")[0].remove();
  }
  injectFltngBtn();
};

/* HANDLED HIDING OF CHROME LAYOUTS IF LOGOUT IS CLICKED */
function handleLogout() {
  // alert("clicked");
  hidePageContent();
  hideMainSideBar();
  localStorage.setItem("display_dash", "false");
}

/* Handle Adding of Plus(+) button to add contact from fb UI */
function addContactFb() {
  setTimeout(function () {
    var allLists = document.getElementsByTagName("ul");
    var indexOfContactList;
    for (i = 0; i < allLists.length; i++) {
      var conditionalCheck = allLists[i].offsetParent.innerText.includes(
        "Contacts"
      );
      if (conditionalCheck) {
        indexOfContactList = i;
      }
    }
    var listOfContacts = Array.from(
      allLists[indexOfContactList].getElementsByTagName("li")
    );
    console.log(listOfContacts, "li of contacts");
    var counter = 0;
    listOfContacts.forEach((contact) => {
      var fbUserMsgUrl = contact.getElementsByTagName("a")[0].href;
      var fbUserId = fbUserMsgUrl.split("/")[5];
      var div_to_insert = contact.getElementsByTagName("div")[4];
      var addIconToAddContactHTML = `<span data-fb-user-id=${fbUserId} class="crm_btn_wrapper_cn ${counter}_main"><div class="soci_crm_add_cn-btn ${counter}"><div class="soci_crm_mark"><button class="add_contact_btn ${counter}"><i class="fas fa-plus-circle ${counter}"></i></button></div></div></span>`;
      div_to_insert.innerHTML += addIconToAddContactHTML;
      div_to_insert.className += ` ${counter}_soci_contact_number`;
      counter++;
    });
    var all_btn_to_listen = document.getElementsByClassName("add_contact_btn");
    for (i = 0; i < all_btn_to_listen.length; i++) {
      // console.log(all_btn_to_listen);
      all_btn_to_listen[i].addEventListener("click", function (e) {
        handleContactAdding(e);
      });
    }
  }, 2000);
}

//************* Function helps to add user contact to db by calling main function addUserContactToDb after data is processed *************//
function handleContactAdding(e) {
  console.log("Running handleContactAdding" + " " + e.target.classList);
  var classNameToFind = `${e.target.classList[2]}_soci_contact_number`;
  var element_targeted = document.getElementsByClassName(classNameToFind);

  if (element_targeted) {
    console.log(element_targeted[0]);
    var fbUserId = element_targeted[0].getElementsByTagName("span")[1].dataset
      .fbUserId;
    var targeted_span = element_targeted[0].getElementsByTagName("span")[1];
    var getParentNode = element_targeted[0].parentElement.getElementsByTagName(
      "span"
    )[2].innerText;
    var nameFromGraph = getParentNode.split(" ");
    var user_fname = nameFromGraph[0];
    var user_lname = nameFromGraph[1];
    var user_fullName = user_fname + " " + user_lname;
    addUserContactToDb(user_fname, user_lname, user_fullName);
  }
}

/* Listen to Event for Contact Getting Changed & update markings function */
function handleChangeForContactCol() {
  // notifyError("Warning", "Updating Contact Markings");
  console.log("Running handleChangeForContactCol");

  if (document.querySelectorAll('[role="complementary"]')) {
  } else {
    console.log("handleChangeForContactCol event not added");
  }
}

// function to handle adding of Contact
function addUserContactToDb(fName, lName, fullName) {
  console.log("inside addUserContactToDb");
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var userID = getDataStorage("soci_crm_userID");
  const data = {
    firstName: fName,
    lastName: lName,
    user_id: userID,
  };
  const hconfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${userJwtToken}`,
    },
  };

  axios
    .post("http://localhost:3000/contacts/add", data, hconfig)
    .then((res) => {
      console.log(res);
      showOneCols();
      notifySuccess("Contact");
      fetchUserContacts();
    })
    .catch((err) => {
      console.log(err);
      notifyError("Invalid Token", "Something Went Wrong");
    });
}

// function to inject contact cards
function fetchUserContacts() {
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var userID = getDataStorage("soci_crm_userID");
  axios
    .get(`http://localhost:3000/contacts/user/${userID}`, {
      headers: {
        Authorization: `${userJwtToken}`,
      },
    })
    .then((res) => {
      // console.log(res.data.contacts);
      var user_cntcts = res.data.contacts;
      createContactCards(user_cntcts);
    })
    .catch((err) => {
      console.error(err);
    });
}

// Create Message Card from API Datas
var createContactCards = (cntct_arr) => {
  console.log(cntct_arr, "cntct_arr");
  var soci_url = chrome.extension.getURL(
    "./dashboard/components/soci_contact_list.html"
  );
  axios.get(soci_url).then((res) => {
    var cntct_generated_html = "";
    var parser = new DOMParser();
    for (cntct in cntct_arr) {
      var contact_user_id = cntct_arr[cntct]._id;
      var contact_fullName = cntct_arr[cntct].fullName;
      var contact_timeStamp = cntct_arr[cntct].createdAt;
      var contact_card_html = parser.parseFromString(res.data, "text/html");

      var fullCardSelector = u(
        contact_card_html.getElementsByClassName("soci_crm_contact_card")
      ).nodes[0];
      var main_name_field = u(
        contact_card_html.getElementsByClassName("soci_card-header-title")
      ).nodes[0];
      var time_stamp_field = u(contact_card_html.getElementsByTagName("time"))
        .nodes[0];
      var contact_expand_btn = u(
        contact_card_html.getElementsByClassName("soci_expand_card_btn")
      ).nodes[0];
      var icon_expand_btn = u(
        contact_card_html.getElementsByClassName("soci_expand_card_icon")
      ).nodes[0];
      var span_expand_btn = u(
        contact_card_html.getElementsByClassName("soci_icon_cn")
      ).nodes[0];
      var contact_name_con_card = u(
        contact_card_html.getElementsByClassName("soci_title_name")
      ).nodes[0];
      var contact_edit_btn = u(
        contact_card_html.getElementsByClassName("soci_edit_btn")
      ).nodes[0];

      fullCardSelector.setAttribute("data-contact-id", contact_user_id);
      contact_expand_btn.setAttribute("data-contact-id", contact_user_id);
      icon_expand_btn.setAttribute("data-contact-id", contact_user_id);
      span_expand_btn.setAttribute("data-contact-id", contact_user_id);
      contact_edit_btn.setAttribute("data-contact-id", contact_user_id);
      main_name_field.innerText = contact_fullName;
      contact_name_con_card.innerText = contact_fullName;
      time_stamp_field.innerText = contact_timeStamp;
      cntct_generated_html += contact_card_html.documentElement.innerHTML;
    }
    var html_to_send =
      '<h2 style="padding: 10px; color: #000000;" class ="section_head">Contacts</h2><br/>';
    html_to_send += cntct_generated_html;
    // inject into block 1
    injectToBlockOne(html_to_send, "contact");
    // Get all dropdowns on the page that aren't hoverable.
    const dropdowns = document.querySelectorAll(".dropdown:not(.is-hoverable)");

    if (dropdowns.length > 0) {
      // For each dropdown, add event handler to open on click.
      dropdowns.forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          el.classList.toggle("is-active");
        });
      });

      // If user clicks outside dropdown, close it.
      document.addEventListener("click", function (e) {
        closeDropdowns();
      });
    }

    /*
     * Close dropdowns by removing `is-active` class.
     */
    function closeDropdowns() {
      dropdowns.forEach(function (el) {
        el.classList.remove("is-active");
      });
    }

    // Close dropdowns if ESC pressed
    document.addEventListener("keydown", function (event) {
      let e = event || window.event;
      if (e.key === "Esc" || e.key === "Escape") {
        closeDropdowns();
      }
    });

    addEventsForContactSection();
  });
};

// function to handle edit of a single contact
function handleContactEdit(e) {
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var clickedContactId = e.target.dataset.contactId;
  console.log(
    "handle Event -",
    clickedContactId ? clickedContactId : "no event found"
  );
  axios
    .get(`http://localhost:3000/contacts/${clickedContactId}`, {
      headers: {
        Authorization: `${userJwtToken}`,
      },
    })
    .then((res) => {
      console.log(res.data.message);
      var contact_to_edit = res.data.message;
      injectContactEditForm(contact_to_edit);
    })
    .catch((err) => {
      console.error(err);
    });
}

// function which injects contact edit form
function injectContactEditForm(contact_data_to_edit) {
  var soci_url = chrome.extension.getURL(
    "./dashboard/components/contactEditForm.html"
  );
  axios.get(soci_url).then((res) => {
    injectToBlockTwo(res.data);
    showBothCols();
    var contactFullName = contact_data_to_edit.fullName;
    var contactEmail = contact_data_to_edit.email
      ? contact_data_to_edit.email
      : "naman@digitaliz.in";
    var contact_id = contact_data_to_edit._id;
    document.querySelector(".soci_user_fullName").value = contactFullName;
    document.querySelector(".soci_name").innerText = contactFullName;
    document.querySelector(".soci_email_id").value = contactEmail;
    document.querySelector(".soci_user_birthDay").value = "17/12/1998";
    // Adds an Event on Save Btn Clicked
    document
      .querySelector(".soci_save_btn_con")
      .addEventListener("click", function () {
        refresher_async(updateContactApi);
      });
    let tabsWithContent = (function () {
      let tabs = document.querySelectorAll(".tabs li");
      let tabsContent = document
        .querySelectorAll(".tabs-content")[0]
        .getElementsByTagName("li");

      let deactvateAllTabs = function () {
        tabs.forEach(function (tab) {
          tab.classList.remove("is-active");
        });
      };

      let hideAllTabs = function () {
        for (x = 0; x < tabsContent.length; x++) {
          tabsContent[x].classList.remove("is-active");
        }
      };

      let activateTabsContent = function (tab) {
        console.log(tab);
        tabsContent[getIndex(tab)].classList.add("is-active");
      };

      let getIndex = function (el) {
        return [...el.parentElement.children].indexOf(el);
      };

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          deactvateAllTabs();
          hideAllTabs();
          tab.classList.add("is-active");
          activateTabsContent(tab);
        });
      });

      tabs[0].click();
    })();
  });
}

// Update Contact API
function updateContactApi() {
  showOneCols();
  notifySuccess("Contacts");
  fetchUserContacts();
}

// function to handle all events for contact list page
function addEventsForContactSection() {
  bulmaTagsinput.attach();
  var elem = u(document.getElementsByClassName("soci_expand_card")).nodes;
  if (elem.length > 0) {
    for (var elem_start = 0; elem_start < elem.length; elem_start++) {
      elem[elem_start].addEventListener("click", function (e) {
        expandCard(e);
      });
    }
  }

  var editBtns = u(document.getElementsByClassName("soci_edit")).nodes;
  if (editBtns.length > 0) {
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].addEventListener("click", function (e) {
        handleContactEdit(e);
      });
    }
  }
}

// function handle expanding of contact cards
var expandCard = (e) => {
  closeAllContactCards();
  console.log(e, "e");
  var d = e.target.getAttribute("data-contact-id");
  console.log(d, "attr");
  document
    .querySelectorAll(`section[data-contact-id="${d}"]`)[0]
    .getElementsByClassName("soci_crm_card_content")[0].style.display = "block";
};

// function closes all contact cards
var closeAllContactCards = () => {
  var allCardsToClose = document.getElementsByClassName(
    "soci_crm_card_content"
  );
  if (allCardsToClose.length > 0) {
    for (
      var elem_start = 0;
      elem_start < allCardsToClose.length;
      elem_start++
    ) {
      allCardsToClose[elem_start].style.display = "none";
    }
  }
};

// function to fetch user's message categories from db
var fetchUserMsgCat = (userJwtToken, userId) => {
  userJwtToken
    ? userJwtToken
    : (userJwtToken = getDataStorage("soci_crm_jwt_token"));
  userId ? userId : (userId = getDataStorage("soci_crm_userID"));
  axios
    .get(`http://localhost:3000/api/v1/message-category/user/${userId}`, {
      headers: {
        Authorization: `${userJwtToken}`,
      },
    })
    .then((res) => {
      console.log(res.data.messageCats);
      var user_msgsCats = res.data.messageCats;
      createMsgCatCards(user_msgsCats);
    })
    .catch((err) => {
      console.error(err);
    });
};

// function to create message category cards
var createMsgCatCards = (msg_arr) => {
  console.log(msg_arr, "msg_arr");
  var soci_url = chrome.extension.getURL(
    "./dashboard/components/msgCategory.html"
  );
  axios.get(soci_url).then((res) => {
    var msg_generated_html = "";
    var parser = new DOMParser();
    var msgCardHtml = parser.parseFromString(res.data, "text/html");

    for (msgData in msg_arr) {
      var msgTitle = msg_arr[msgData].cat_title;
      var msgId = msg_arr[msgData]._id;
      var createdAt = msg_arr[msgData].createdAt;
      // Set proper classnames with proper ids for event listeners
      msgCardHtml.getElementsByClassName(
        "soci_msg_cards"
      )[0].className = `soci_msg_cards ${msgId}`;
      msgCardHtml.getElementsByClassName(
        "soci_heading"
      )[0].className = `soci_heading soci_msg_heading ${msgId}`;
      // Set Proper Values to elements
      msgCardHtml
        .getElementsByClassName("soci_msg_cards")[0]
        .getElementsByClassName("soci_msg_full")[0].innerText = createdAt;
      msgCardHtml
        .getElementsByClassName("soci_msg_cards")[0]
        .getElementsByClassName("soci_heading")[0].innerText = msgTitle;

      msg_generated_html += msgCardHtml.documentElement.innerHTML;
    }
    var html_to_send =
      '<h2 style="padding: 10px; color: #000000;" class ="section_head">Message Categories</h2><br/>';
    html_to_send += msg_generated_html;
    injectToBlockOne(html_to_send, "msgCat");
  });
};

// Function to handle events for message categories
var handleMsgCatEvents = () => {
  console.log("Info @ SociCRM : handleMsgCatEvents Ran");
  // add event on click of any message cards
  var allMsgCards = document.querySelectorAll(".soci_heading");
  allMsgCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      refresher_async(function () {
        handleMsgCatEdit(e);
      });
    });
  });
};

// handles Msg Edit Event
function handleMsgCatEdit(e) {
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var clickedMsgTitleClass = e.target.classList[2];
  console.log(
    "handle Event Ok",
    clickedMsgTitleClass ? clickedMsgTitleClass : "no event found"
  );
  axios
    .get(
      `http://localhost:3000/api/v1/message-category/${clickedMsgTitleClass}`,
      {
        headers: {
          Authorization: `${userJwtToken}`,
        },
      }
    )
    .then((res) => {
      console.log(res.data.messagesCat);
      var user_msg_to_edit = res.data.messagesCat;
      injectMsgCatEditForm(user_msg_to_edit);
    })
    .catch((err) => {
      console.error(err);
    });
}

// Fetch & Inject Msg Category Edit Form
function injectMsgCatEditForm(msg_data_to_edit) {
  var soci_url = chrome.extension.getURL(
    "./dashboard/components/msgCategoryEdit.html"
  );
  axios.get(soci_url).then((res) => {
    injectToBlockTwo(res.data);
    showBothCols();
    var msg_title = msg_data_to_edit.cat_title;
    var msg_id = msg_data_to_edit._id;
    document.querySelector("#msg_title").value = msg_title;
    document.querySelector("#msg_id").value = msg_id;
    // Adds an Event on Save Btn Clicked
    document
      .querySelector("#submit_soci_msg_edit")
      .addEventListener("click", function () {
        refresher_async(updateMsgCatApi);
      });
  });
}

// Update Message Category
function updateMsgCatApi() {
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var msgID = document.querySelector("#msg_id").value;
  var msgTitle = document.querySelector("#msg_title").value;
  const hconfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${userJwtToken}`,
    },
  };
  var msg_obj = {
    title: `${msgTitle}`,
  };
  axios
    .put(
      `http://localhost:3000/api/v1/message-category/${msgID}`,
      msg_obj,
      hconfig
    )
    .then((res) => {
      console.log(res);
      showOneCols();
      notifySuccess("Message Category");
      fetchUserMsgCat();
    })
    .catch((err) => {
      console.log(err);
      notifyError("Invalid Token", "Something Went Wrong");
    });
}

// FUNCTION WHICH HANDLES KEYBOARD EVENTS TO SHOW MESSAGE CATEGORIES AS POPUP
function handleKeyboardEvent(e) {
  console.log(e, "this is e");
  console.log(e.path[13].classList[0], "this is path");
  var classToQuery = e.path[13].classList[0];
  var finalClToQuery = "." + classToQuery;
  var correctSelector = e.path[13].querySelectorAll(finalClToQuery);
  var divToShowMsgCategories = correctSelector[0].innerHTML;
  // Remove Already Existing Sections Starts
  var allPopupMsgBox = document.getElementsByClassName("panel");
  for (n = 0; n < allPopupMsgBox.length; n++) {
    allPopupMsgBox[n].remove();
  }
  // Remove Already Existing Sections Ends
  fetchAllCatForMsngr(e);
}

// fetches all categories of a user
var fetchAllCatForMsngr = (e, userJwtToken, userId) => {
  userJwtToken
    ? userJwtToken
    : (userJwtToken = getDataStorage("soci_crm_jwt_token"));
  userId ? userId : (userId = getDataStorage("soci_crm_userID"));
  axios
    .get(`http://localhost:3000/api/v1/message-category/user/${userId}`, {
      headers: {
        Authorization: `${userJwtToken}`,
      },
    })
    .then((res) => {
      console.log(res.data.messageCats);
      var user_msgsCats = res.data.messageCats;
      createMsgCategoryListMsngr(e, user_msgsCats);
    })
    .catch((err) => {
      console.error(err);
    });
};

var createMsgCategoryListMsngr = (e, arrOfCats) => {
  console.log(arrOfCats, "all Cats to inject in msngr chat");
  var soci_url = chrome.extension.getURL(
    "./dashboard/components/msgPopupList.html"
  );

  axios.get(soci_url).then((res) => {
    // console.log(res.data);
    var classToQuery = e.path[13].classList[0];
    var finalClToQuery = "." + classToQuery;
    var correctSelector = e.path[13].querySelectorAll(finalClToQuery);
    var divToShowMsgCategories = correctSelector[0].innerHTML;
    var parser = new DOMParser();
    var fullDocHtml = parser.parseFromString(res.data, "text/html");
    var htmlToInject;
    arrOfCats.forEach((elem) => {
      var cat_title = elem.cat_title;
      var cat_id = elem._id;
      var fin_html = `<a href=#${cat_id} data-cat-id=${cat_id} class="panel-block soci_list_cat"><span class="panel-icon"><i class="fas fa-folder" aria-hidden="true"></i></span>${cat_title}</a>`;
      // console.log(htmlToInject, "inner html");
      htmlToInject += fin_html;
    });
    // console.log(htmlToInject, "<a> tags");
    // first injecting cat links into proper blocks as html
    fullDocHtml.getElementsByClassName(
      "soci_panel_container"
    )[0].innerHTML = htmlToInject;
    // injecting html to correct place
    correctSelector[0].innerHTML += fullDocHtml.documentElement.innerHTML;
    // console.log(correctSelector[0].innerHTML, "<a> tags");

    // Add event listener on button after injecting the DOM
    handleEventsInMsngrCats(e);
  });
};

// function which handles adding of events to the panel of chat in messenger categories
var handleEventsInMsngrCats = (e) => {
  var e = e;
  var arrOfAllListCats = document.getElementsByClassName("soci_list_cat");
  for (var cat = 0; cat < arrOfAllListCats.length; cat++) {
    arrOfAllListCats[cat].addEventListener("click", function (e) {
      var cat_id_clicked = e.target.dataset.catId;
      // fn to handle List Cat Click
      handleListCatClick(cat_id_clicked, e);
    });
  }

  // select all <a> tags
  // add an event listener function which handles showing of category based on the <a> tag clicked
  // get the cat_id attatched to all the <a> tags from the target.dataset.catId or target.dataset.cat_id
};

var handleListCatClick = (cat_id_clicked, e) => {
  var catIdToFetchData = cat_id_clicked;
  var userJwtToken = getDataStorage("soci_crm_jwt_token");
  var userId = getDataStorage("soci_crm_userID");
  // new
  userJwtToken
    ? userJwtToken
    : (userJwtToken = getDataStorage("soci_crm_jwt_token"));
  userId ? userId : (userId = getDataStorage("soci_crm_userID"));
  axios
    .get(`http://localhost:3000/api/v1/message/${userId}/${catIdToFetchData}`, {
      headers: {
        Authorization: `${userJwtToken}`,
      },
    })
    .then((res) => {
      console.log(res.data.messages);
      var user_msgs = res.data.messages;
      user_msgs.length > 0
        ? handleMsgDisp(user_msgs, e)
        : notifyError("Error", "No Messages Found for Category Clicked");
      console.log(user_msgs, "msg inside");
      // createMsgCards(user_msgs);
    })
    .catch((err) => {
      console.error(err);
    });
};

var hideAllListCats = () => {
  var arrOfAllListCats = document.getElementsByClassName("soci_list_cat");
  for (var cat = 0; cat < arrOfAllListCats.length; cat++) {
    arrOfAllListCats[cat].style.display = "none !important";
  }
};

var handleMsgDisp = (msg_to_disp, e) => {
  hideAllListCats();
  console.log(msg_to_disp, "disp msg");
  console.log(e, "event in");
  // console.log(arrOfCats, "all Cats to inject in msngr chat");
  var htmlToInject;
  msg_to_disp.forEach((elem) => {
    var title = elem.title;
    var msg_id = elem._id;

    var fin_html = `<a href=#${msg_id} data-msg-id=${msg_id} class="panel-block soci_list_msg"><span class="panel-icon"><i class="fas fa-folder" aria-hidden="true"></i></span>${title}</a>`;
    // console.log(htmlToInject, "inner html");
    htmlToInject += fin_html;
  });
  document.getElementsByClassName(
    "soci_panel_container"
  )[0].innerHTML = htmlToInject;

  // adding events to handle category click
  var arrOfMsgList = Array.from(
    document.getElementsByClassName("soci_list_msg")
  );
  if (arrOfMsgList.length > 0) {
    arrOfMsgList.forEach((msg) => {
      msg.addEventListener("click", function (e) {
        var msgToSend = e.target.innerText;
        copyToClipboard(msgToSend);
        notifySuccess("Message Copied to Clipboard");
      });
    });
  }
};

var copyToClipboard = (str) => {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};
