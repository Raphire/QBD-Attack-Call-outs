// Shows a temporary rectangle around the selected chatbox
function showSelectedChat(chat) {
  try {
    alt1.overLayRect(
      A1lib.mixColor(255, 255, 255),
      chat.mainbox.rect.x,
      chat.mainbox.rect.y,
      chat.mainbox.rect.width,
      chat.mainbox.rect.height,
      2000,
      3
    );
  } catch { }
}

// Updates the text inside element
function message(str,elementId="incomingBox",color="white") {
  if (elid(elementId).innerHTML != str) {
    elid(elementId).innerHTML = str;
    elid(elementId).style.color = color;
  }
}

// Updates the text in the tooltip
function updateTooltip(str = "") {
  currentTooltip = str;

  if (currentTooltip != "") {
    if (!alt1.setTooltip(" " + currentTooltip)) {
      console.log("Error: No tooltip permission");
    }
  }
  else {
    alt1.clearTooltip();
  }
}

function getChatReader() {
  return chatReader;
}

function hideAntifireIndicator() {
  elid("body").classList.remove("green-border");
  elid("body").classList.remove("red-border");
  elid("body").classList.remove("blue-border");
  elid("body").classList.remove("yellow-border");
  elid("body").classList.remove("white-border");
  elid("antifireImage").classList.add("d-none");
}
