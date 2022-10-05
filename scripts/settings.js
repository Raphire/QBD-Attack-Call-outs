let tooltipSetting = 1;
let antifireSetting = 1;
let antifireBorderSetting = 1;
let antifireSoundSetting = 0;
let startOffset = 0;

function toggleSoundEffectSetting() {
  if (antifireSetting == 1) {
    elid("qbdSoundSetting").classList.remove("locked");
    elid("qbdSoundSelect").disabled = false;
    elid("antifireBorderSetting").classList.remove("locked");
    elid("antifireBorderSelect").disabled = false;
  }
  else {
    elid("qbdSoundSetting").classList.add("locked");
    elid("qbdSoundSelect").disabled = true;
    elid("antifireBorderSetting").classList.add("locked");
    elid("antifireBorderSelect").disabled = true;
  }
}

$('document').ready(function() {
  $(".chat").change(function () {
    localStorage.setItem("qbdChat", parseInt($(this).val()));

    window.opener.updateChatSetting();
  });

  $(".ttSelect").change(function () {
    localStorage.setItem("qbdTT", parseInt($(this).val()));

    window.opener.updateTooltipSetting();
  });

  $(".antifireDetection").change(function () {
    antifireSetting = parseInt($(this).val());
    localStorage.setItem("qbdAntifire", antifireSetting);

    toggleSoundEffectSetting();

    window.opener.updateAntifireSetting();
  });

  $(".antifireBorder").change(function () {
    localStorage.setItem("qbdAntifireBorder", $(this).val());

    window.opener.updateAntifireBorder(true);
  });

  $(".qbdSound").change(function () {
    localStorage.setItem("qbdAntifireSound", $(this).val());

    window.opener.updateAlertSound(true);
  });

  $("#startDelayInput").change(function () {
    startOffset = $(this).val();

    if (startOffset >= 0 && startOffset <= 2000) {
      localStorage.setItem("qbdStartDelay", startOffset);

      window.opener.updateStartOffset();
    }
  });

  startDelayInput = document.getElementsByName('startDelayInput');

  // Check for saved start delay & set it
  if (localStorage.qbdStartDelay) {
    startOffset = parseInt(localStorage.qbdStartDelay);
  }
    
  startDelayInput[0].value = startOffset;
    
  // Check for saved tooltipSetting & set it
  if (localStorage.qbdTT) {
    tooltipSetting = parseInt(localStorage.qbdTT);
  }
  
  $(".ttSelect").val(tooltipSetting);

  // Check for saved super antifire detection & set it
  if (localStorage.qbdAntifire) {
    antifireSetting = parseInt(localStorage.qbdAntifire);
    toggleSoundEffectSetting();
  }

  $(".antifireDetection").val(antifireSetting);

  // Check for saved super antifire border effect & set it
  if (localStorage.qbdAntifireBorder) {
    antifireBorderSetting = parseInt(localStorage.qbdAntifireBorder);
  }

  $("#antifireBorderSelect").val(antifireBorderSetting);

  // Check for saved super antifire sound effect & set it
  if (localStorage.qbdAntifireSound) {
    antifireSoundSetting = parseInt(localStorage.qbdAntifireSound);
  }

  $("#qbdSoundSelect").val(antifireSoundSetting);

  // Get ALL chatboxes on screen & fill selection
  let chatBoxes = window.opener.getChatReader();

  chatBoxes.pos.boxes.map((box, i) => {
    $(".chat").append(`<option value=${i}>Chat ${i}</option>`);
  });

  // Check for saved selected chat & set it
  if (localStorage.qbdChat) {
    $(".chat").val(localStorage.qbdChat);
  }
});
