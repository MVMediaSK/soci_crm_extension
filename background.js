chrome.extension.onMessage.addListener(receiver);

function receiver(request, sender, sendResponse) {
  // Showing the page action if the content script says to
  if (request.message === "get_logged_in_user")
    return sendResponse({ data: localStorage });
  console.log("Info: User Sent to Content Script @ SociCRM");
}
