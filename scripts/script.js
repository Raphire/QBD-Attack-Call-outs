/// <reference path="bosstimer.d.ts" />

//Enable "Add App" button for Alt1 Browser.
A1lib.identifyApp("appconfig.json");

let isPaused = true;
let antifireActive = false;
let lastUIUpdate = Date.now();
let oldLineTime = new Date();
let currentTooltip = "";

let bossPhase = 1;
let firstPhaseupdate = true;
let intervalCount = 0;
let chatEndDetected = false;
let attackEndCount = 0;
let buffInactiveCount = 0;
let loadingCount = 2;

let tooltipSetting = 1;
let attackSoundSetting = 11;
let artifactSoundSetting = 9;
let antifireSetting = 1;
let antifireBorderSetting = 1;
let antifireSoundSetting = 0;
let startOffset = 0;

let debugMode = false;


// Dictionary containing qbd's attacks, their timings and the counter move
let attacks = {
  1: ["Fire Wall", "Surge/Stand in gap"],
  2: ["Tortured souls", "Side step"],
  3: ["Extreme dragon breath", "Stand to the side"]
}

// Dictionary containing the alert sounds and their volume
let alertSounds = {
  1: ["./assets/shatter.mp3", 0.5],
  2: ["./assets/shatter2.mp3", 0.4],
  3: ["./assets/bell.mp3", 0.1],
  4: ["./assets/spell.mp3", 0.05],
  5: ["./assets/damage.mp3", 0.1],
  6: ["./assets/fireball.mp3", 0.1],
  7: ["./assets/alert.mp3", 0.1],
  8: ["./assets/beep.mp3", 0.7],
  9: ["./assets/beeps.mp3", 0.7],
  10: ["./assets/softbeep.mp3", 0.7],
  11: ["./assets/softendbeep.mp3", 0.7],
  12: ["./assets/xylo.mp3", 0.3],
  13: ["./assets/xyloend.mp3", 0.25],
  69: ["./assets/warningend.mp3", 0.5]
}

// Dictionary containing border colors for settings
let borderColors = {
  1: ["green-border", "red-border"],
  2: ["blue-border", "red-border"],
  3: ["blue-border", "yellow-border"],
  4: ["blue-border", "white-border"],
  5: ["white-border", "red-border"]
}

let alertSound = new Audio("./assets/shatter.mp3");
let attackSound = new Audio("./assets/softendbeep.mp3");
let artifactSound = new Audio("./assets/beeps.mp3");

// Set Chat reader with all textcolors etc.
let chatReader = new Chatbox.default();
chatReader.readargs = {
  colors: [
    A1lib.mixColor(255, 255, 255), // Normal Text White
    A1lib.mixColor(130, 70, 184),  // Gorvek Purple
    A1lib.mixColor(159,255,159),   // Clan chat green
    A1lib.mixColor(255, 82, 86),   // PM Red
    A1lib.mixColor(255, 0, 0),     // Very Red Red
    A1lib.mixColor(0, 174, 0),     // Crystal Mask Green
    A1lib.mixColor(45, 184, 20),   // Completion Time Green
    A1lib.mixColor(67, 188, 188),  // Contribution Score Green
    A1lib.mixColor(102, 152, 255), // Notable Drops Blue
    A1lib.mixColor(235, 47, 47),   // Rot Mistake Red
    A1lib.mixColor(255, 255, 0),   // Blessing From The Gods Yellow
    A1lib.mixColor(0, 255, 255),   // Seren Spirit Cyan
    A1lib.mixColor(30, 255, 0),    // Catalyst Of Alteration Green
    A1lib.mixColor(127, 169, 255), // Public Chat Blue
    A1lib.mixColor(0, 255, 0),     // Artificer's Measure Green
    A1lib.mixColor(255, 112, 0),   // Luck Ring Orange
    A1lib.mixColor(163, 53, 238),  // Rare Drop Purple
    A1lib.mixColor(153, 0, 0),     // Tortured Souls
    A1lib.mixColor(255, 51, 0),    // Tortured Souls
    A1lib.mixColor(153, 0, 204),   // Tortured Souls
    A1lib.mixColor(181, 109, 0),   // Extreme Dragon Breath
    A1lib.mixColor(99, 237, 255),  // Extreme Dragon Breath

  ],
  backwards: true,
};

let bossTimerReader = new BossTimer.default();

let buffReader = new BuffsReader.default();

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

// Buff reader interval
let buffReadInterval = null;

// Chat finder & parser functions adapted from: https://github.com/ZeroGwafa/SerenTracker
let findChat = setInterval(function () {
  if (chatReader.pos === null) {
    try {
      var dots = ".";
    
      for (var y = 0; y < loadingCount % 3; y++) {
        dots += ".";
      }
  
      loadingCount++;
  
      message("Looking for chatbox" + dots);
      
      chatReader.find();
    }
    catch(e) {
      if (e.message == "capturehold failed") {
        message("Error: Can't find RS\nclient; Restart Alt1");
      }
      else if (e.message.includes("No permission")) {
        message("Error: No permission\nInstall app first");
      }
      else if (e.message == "alt1 is not defined") {
        message("Error: Alt1 is not found\nOpen app in Alt1");
      }
      else {
        message("Unknown Error\nCheck console for info");
        console.log("Error: " + e.message);
      }
    }
  }
  else {
    console.log("Chatbox found!");

    message("Ready!\nAwaiting boss start...");
    
    clearInterval(findChat);

    if (localStorage.qbdChat && parseInt(localStorage.qbdChat) <= (chatReader.pos.boxes.length - 1)) {
      chatReader.pos.mainbox = chatReader.pos.boxes[parseInt(localStorage.qbdChat)];
    } 
    else {
      //If multiple boxes are found, this will select the first, which should be the top-most chat box on the screen.
      chatReader.pos.mainbox = chatReader.pos.boxes[0];
    }
    
    showSelectedChat(chatReader.pos);

    // Start interval for antifire detection if enabled
    if (antifireSetting != 0) {
      buffReadInterval = setInterval(function () {
        readBuffBar();
      }, 600);
    }

    // Start interval for reading chatbox/bosstimer
    setInterval(function () {
      if (intervalCount % 2) {
        readBossTimer();
      }
      else {
        readChatbox();
        clearUI();
      }

      intervalCount = intervalCount + 1;
    }, 300);
  }
}, 1000);

// Reading and parsing info from the chatbox.
function readChatbox() {
  var lines = chatReader.read() || [];
  const numLines = lines.length;

  for (let idx = 0; idx < numLines; idx++) {
    let lineTime = new Date();
    let lineTimeStr;

    if (debugMode) {
      console.log(lines[idx]);
    }

    try {
      // Match for the (first) timestamp in the chatline
      lineTimeStr = lines[idx].text.match(/[0-9]{2}[:]{1}[0-9]{2}[:]{1}[0-9]{2}/g)[0];

      // Check whether a timestamp has been found in the chatline
      if (lineTimeStr != null) {
        let lineTimeSplit = lineTimeStr.split(':');

        // Check if chatline was from previous day & fix lineTime if true
        if(lineTimeSplit[0] == 23 && lineTime.getHours() == 00) {
          lineTime.setDate(lineTime.getDate() - 1);
        }

        lineTime.setHours(lineTimeSplit[0]);
        lineTime.setMinutes(lineTimeSplit[1]);
        lineTime.setSeconds(lineTimeSplit[2]);
      }
    }
    catch {
      if (debugMode) {
        console.log("Error: No timestring in chatline");
      }
    }

    // Check if timestamp is newer than previous read chatline, or if there's no timestamp at all (as timestamps are not enabled by default)
    if(oldLineTime <= lineTime) {
      if (lineTimeStr != null) {
        oldLineTime = lineTime;
      }

      // Check for lines indicating fire wall attack
      if ((lines[idx].text.includes("The Queen Black Dragon takes a huge breath"))) {
        message("Incoming Attack: \nFire Wall");
        lastUIUpdate = Date.now();

        if (attackSoundSetting != 0) {
          attackSound.play();
        }

        updateUI(1);
      }
      
      // Check for lines indicating tortured souls attack
      else if ((lines[idx].text.includes("Queen Black Dragon summons one")) || 
              (lines[idx].text.includes("The Queen Black Dragon summons several"))) {
        message("Incoming Attack: \nTortured Souls");
        lastUIUpdate = Date.now();

        if (attackSoundSetting != 0) {
          attackSound.play();
        }

        updateUI(2);
      }

      // Check for lines indicating extreme flames attack
      else if ((lines[idx].text.includes("Queen Black Dragon gathers her strength to breathe extremely"))) {
        message("Incoming Attack: \nExtreme Dragon Breath");
        lastUIUpdate = Date.now();

        if (attackSoundSetting != 0) {
          attackSound.play();
        }

        updateUI(3);
      }

      // Check for lines indicating crystal form 
      else if ((lines[idx].text.includes("Queen Black Dragon takes on the consistency of crystal"))) {
        message("The QBD is now: \nWeak To Ranged");
        lastUIUpdate = Date.now();

        updateUI();
      }

      // Check for lines indicating carapace form
      else if ((lines[idx].text.includes("Queen Black Dragon hardens her carapace"))) {
        message("The QBD is now: \nWeak To Magic");
        lastUIUpdate = Date.now();

        updateUI();
      }

      // Check for lines indicating an artefact is active
      else if ((lines[idx].text.includes("Queen Black Dragon's concentration wavers"))) {
        if ((lines[idx].text.includes("the first") && bossPhase == 1)) {
          bossPhase = 2;
          firstPhaseupdate = true;

          if (artifactSoundSetting != 0) {
            artifactSound.play();
          }

          message("Activate the \nfirst artefact!");
          
          if (tooltipSetting != 0) {
            updateTooltip("First artefact");
          }

          $("#firstArtefact").attr("src", "assets/artefact-active.png");
        }
        else if ((lines[idx].text.includes("the second")) && bossPhase == 2) {
          bossPhase = 3;
          firstPhaseupdate = true;

          if (artifactSoundSetting != 0) {
            artifactSound.play();
          }

          message("Activate the \nsecond artefact!");
          
          if(tooltipSetting != 0) {
            updateTooltip("Second artefact");
          }

          $("#firstArtefact").attr("src", "assets/artefact-done.png");
          $("#secondArtefact").attr("src", "assets/artefact-active.png");
        }
        else if ((lines[idx].text.includes("the third"))  && bossPhase == 3) {
          bossPhase = 4;
          firstPhaseupdate = true;
          
          if (artifactSoundSetting != 0) {
            artifactSound.play();
          }

          message("Activate the \nthird artefact!");

          if(tooltipSetting != 0) {
            updateTooltip("Third artefact");
          }

          $("#firstArtefact").attr("src", "assets/artefact-done.png");
          $("#secondArtefact").attr("src", "assets/artefact-done.png");
          $("#thirdArtefact").attr("src", "assets/artefact-active.png");
        }
        else if ((lines[idx].text.includes("the last"))  && bossPhase == 4) {
          if (artifactSoundSetting != 0) {
            artifactSound.play();
          }
          
          message("Activate the \nlast artefact!");

          if(tooltipSetting != 0) {
            updateTooltip("Fourth artefact");
          }

          $("#firstArtefact").attr("src", "assets/artefact-done.png");
          $("#secondArtefact").attr("src", "assets/artefact-done.png");
          $("#thirdArtefact").attr("src", "assets/artefact-done.png");
          $("#fourthArtefact").attr("src", "assets/artefact-active.png");
        }

        lastUIUpdate = Date.now();
      }

      // Check for lines indicating the end of the fight
      else if (lines[idx].text.includes("The enchantment is restored! The Queen Black Dragon falls")) {
        chatEndDetected = true;
        
        updateTooltip();
        
        $("#fourthArtefact").attr("src", "assets/artefact-done.png");
      }
    }
    else {
      if (debugMode)
      {
        console.log("Error: Old message!");
      }
    }
  }
}

// Checks for boss timer on-screen and starts/stops the timer accordingly
function readBossTimer() {
  if (bossTimerReader.find() != null) {
    attackEndCount = 0;

    if (isPaused) {
      startEncounter(startOffset);
    }
  }
  else if (!isPaused && bossTimerReader.find() == null && debugMode == false) {
    // End encounter if an end of fight chatline has been detected & bosstimer has not been detected for at least 3 ticks
    if (chatEndDetected && attackEndCount >= 4) {
      stopEncounter();
    }
    // In case a chatline was missed end encounter after a set amount of time (10 ticks by default)
    else if (attackEndCount >= 10) {
      stopEncounter();
    }

    attackEndCount = attackEndCount + 1;
  }
}

function clearUI() {
  if(!isPaused) {
    let time = Date.now() - lastUIUpdate;
  
    if(time >= 7000) {
      message("");
      updateTooltip();
    }
  }
}

function updateUI(attackType = 0) {
  if (firstPhaseupdate) {
    firstPhaseupdate = false;

    switch (bossPhase) {
      case 1:
        break;
      case 2:
        $("#firstArtefact").attr("src", "assets/artefact-done.png");
        $("#secondArtefact").attr("src", "assets/artefact.png");
        break;
      case 3:
        $("#secondArtefact").attr("src", "assets/artefact-done.png");
        $("#thirdArtefact").attr("src", "assets/artefact.png");
        break;
      case 4:
        $("#thirdArtefact").attr("src", "assets/artefact-done.png");
        $("#fourthArtefact").attr("src", "assets/artefact.png");
        break;
      default:
        console.log("Error: Invalid boss phase!");
        break;
    }
  }

  if (attackType != 0) {
    switch(tooltipSetting) {
      case 1:
        updateTooltip(attacks[attackType][0]);
        break;
      case 2:
        updateTooltip(attacks[attackType][1]);
        break;
      case 3:
        updateTooltip(attacks[attackType][0] + ", " + attacks[attackType][1]);
        break;
      case 0:
        break;
      default:
        console.log("Error: Invalid tooltip setting!");
        break;
    }
  }
}

// Reading & parsing info from the buff bar
function readBuffBar() {
  // Only check if super antifire detection is enabled
  if (antifireSetting != 0) {
    // First check if a buff bar has already been found, if not look for one now
    if (buffReader.pos === null) {
      buffReader.find();
    }
    else {
      let buffReadout = buffReader.read();
      const image = new Image;
      image.src = "./assets/antifire_new.png";
      image.onload = () => {
        let imgFound = false;

        ctx.drawImage(image, 0, 0);
        imageData = ctx.getImageData(0, 0, 25, 25);
        
        // Iterate through all buffs to find a buff matching the imgSrc
        for (var buffObj in buffReadout) {
          let countMatch = buffReadout[buffObj].countMatch(imageData,false).passed;

          if (countMatch >= 150) {
            imgFound = true;
          }
        }

        // Add border if buff is found
        if (imgFound) {
          buffInactiveCount = 0;

          if (!antifireActive) {
            antifireActive = true;
      
            if (antifireBorderSetting != 0) {
              elid("body").classList.add(borderColors[antifireBorderSetting][0]);
              elid("body").classList.remove(borderColors[antifireBorderSetting][1]);
            }
  
            elid("antifireImage").classList.remove("d-none");
          }
        }
        else if (antifireActive && !imgFound) {
          buffInactiveCount = buffInactiveCount + 1;

          if(buffInactiveCount >= 8) {
            antifireActive = false;
            buffInactiveCount = 0;
  
            if (antifireBorderSetting != 0) {
              elid("body").classList.remove(borderColors[antifireBorderSetting][0]);
              elid("body").classList.add(borderColors[antifireBorderSetting][1]);
            }
            elid("antifireImage").classList.add("d-none");
      
            // Play sound if enabled in settings
            if (antifireSoundSetting != 0) {
              alertSound.play();
  
              // To do: Add text overlay as an option
              //alt1.overLayTextEx("Super antifire has run out!", A1lib.mixColor(0, 255, 0), 25,parseInt(alt1.rsWidth/2),parseInt((alt1.rsHeight/2)-300),3000,"monospace",true,true);
            }
          }
        }
      }
    }
  }
}

// Start of boss encounter
function startEncounter(offset = 0) {
  isPaused = false;
  lastUIUpdate = Date.now();
  oldLineTime = new Date();

  message("Encounter started");

  // Change first artefact image
  $("#firstArtefact").attr("src", "assets/artefact.png");
}

// End of boss encounter
function stopEncounter() {
  isPaused = true;
  firstPhaseupdate = false;
  chatEndDetected = false;
  currentTooltip = "";
  bossPhase = 1;
  attackEndCount = 0;
  intervalCount = 0;

  updateTooltip();

  message("Encounter ended\nAwaiting boss start...");

  // Reset artefact images to inactive (grey) version
  $("#firstArtefact").attr("src", "assets/artefact-inactive.png");
  $("#secondArtefact").attr("src", "assets/artefact-inactive.png");
  $("#thirdArtefact").attr("src", "assets/artefact-inactive.png");
  $("#fourthArtefact").attr("src", "assets/artefact-inactive.png");
}

// Gets called when user presses the alt + 1 keybind.
function alt1onrightclick(obj) {
  // To do: Implemented use for alt + 1 keybind.
}

// Update the selected chatbox with new value from localstorage
function updateChatSetting() { 
  if (localStorage.qbdChat && parseInt(localStorage.qbdChat) < chatReader.pos.boxes.length) {
    chatReader.pos.mainbox = chatReader.pos.boxes[localStorage.qbdChat];

    showSelectedChat(chatReader.pos);

    console.log("Selected chatbox changed to: " + localStorage.qbdChat);
  } 
}

// Update the tooltip setting with new value from localstorage
function updateTooltipSetting() {
  if (localStorage.qbdTT) {
    tooltipSetting = parseInt(localStorage.qbdTT);

    updateTooltip();

    console.log("Tooltip setting changed to: " + tooltipSetting);
  }
}

// Update the attack sound setting with new value from localstorage
function updateAttackSound(playSound=false) {
  if (localStorage.qbdAttackSound) {
    attackSoundSetting = parseInt(localStorage.qbdAttackSound);

    if (attackSoundSetting != 0) {
      attackSound = new Audio(alertSounds[attackSoundSetting][0]);
      attackSound.volume = alertSounds[attackSoundSetting][1];
    }
  
    if (playSound) {
      if (attackSoundSetting != 0) {
        attackSound.play();
      }

      console.log("Attack sound setting changed to: " + attackSoundSetting);
    }
  }
}

// Update the artifact sound setting with new value from localstorage
function updateArtifactSound(playSound=false) {
  if (localStorage.qbdArtifactSound) {
    artifactSoundSetting = parseInt(localStorage.qbdArtifactSound);

    if (artifactSoundSetting != 0) {
      artifactSound = new Audio(alertSounds[artifactSoundSetting][0]);
      artifactSound.volume = alertSounds[artifactSoundSetting][1];
    }
  
    if (playSound) {
      if (artifactSoundSetting != 0) {
        artifactSound.play();
      }

      console.log("Artifact sound setting changed to: " + artifactSoundSetting);
    }
  }
}

// Update the Super antifire detection setting with new value from localstorage
function updateAntifireSetting() {
  if (localStorage.qbdAntifire) {
    antifireSetting = parseInt(localStorage.qbdAntifire);

    if (antifireSetting == 0) {
      hideAntifireIndicator();
      clearInterval(buffReadInterval);
      buffReadInterval = null;
      antifireActive = false;
      buffInactiveCount = 0;
    }
    else if (buffReadInterval === null) {
      buffReadInterval = setInterval(function () {
        readBuffBar();
      }, 600);
    }

    console.log("Super antifire detection setting changed to: " + antifireSetting);
  }
}

// Update the antifire border setting with new value from localstorage
function updateAntifireBorder() {
  if (localStorage.qbdAntifireBorder) {
    antifireBorderSetting = parseInt(localStorage.qbdAntifireBorder);
    
    hideAntifireIndicator();

    if (antifireActive) {
      antifireActive = false;
    }
    
    console.log("Super antifire border setting changed to: " + antifireBorderSetting);
  }
}

// Update the Super antifire detection sound setting with new value from localstorage
function updateAlertSound(playSound=false) {
  if (localStorage.qbdAntifireSound) {
    antifireSoundSetting = parseInt(localStorage.qbdAntifireSound);

    if (antifireSoundSetting != 0) {
      alertSound = new Audio(alertSounds[antifireSoundSetting][0]);
      alertSound.volume = alertSounds[antifireSoundSetting][1];
    }
  
    if (playSound) {
      if (antifireSoundSetting != 0) {
        alertSound.play();
      }

      console.log("Super antifire detection sound setting changed to: " + antifireSoundSetting);
    }
  }
}

// Update the start delay with new value from localstorage
function updateStartOffset() {
  if (localStorage.qbdStartDelay) {
    startOffset = parseInt(localStorage.qbdStartDelay);

    console.log("Start delay changed to: " + startOffset);
  }
}

$('document').ready(function() {
  $("#debugButton").click(function () {
    if (debugMode == false) {
      startEncounter();
      debugMode = true;
    }
    else {
      stopEncounter();
      debugMode = false;
    }
  });

  // Check for saved start delay & set it
  if (localStorage.qbdStartDelay) {
    startOffset = parseInt(localStorage.qbdStartDelay);
  }
    
  // Check for saved tooltipSetting & set it
  if (localStorage.qbdTT) {
    tooltipSetting = parseInt(localStorage.qbdTT);
  }

  // Check for saved attackSoundSetting & set it
  if (localStorage.qbdAttackSound) {
    updateAttackSound();
  }
  else {
    attackSound.volume = alertSounds[attackSoundSetting][1];
  }

  // Check for saved artifactSoundSetting & set it
  if (localStorage.qbdArtifactSound) {
    updateArtifactSound();
  }
  else {
    artifactSound.volume = alertSounds[artifactSoundSetting][1];
  }

  // Check for saved super antifire detection & set it
  if (localStorage.qbdAntifire) {
    antifireSetting = parseInt(localStorage.qbdAntifire);
  }

  // Check for saved antifire border setting & update
  if (localStorage.qbdAntifireBorder) {
    antifireBorderSetting = parseInt(localStorage.qbdAntifireBorder);
  }

  // Check for saved super antifire sound setting & update
  if (localStorage.qbdAntifireSound) {
    updateAlertSound();
  }
  else {
    alertSound.volume = alertSounds[antifireSoundSetting][1];
  }

  // Show debug button if qbdDebug flag exists in localstorage
  if (localStorage.qbdDebug) {
    elid("debugButton").classList.remove("d-none");
    elid("antifireImage").classList.add("debugActive");
  }
});
