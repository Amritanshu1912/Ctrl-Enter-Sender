// ==UserScript==
// @name         Ctrl+Enter Sender
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Enable sending messages with Ctrl+Enter on specific websites
// @author       You
// @match        https://chat.openai.com/*
// @match        https://poe.com/*
// @match        https://www.phind.com/*
// @match        https://bard.google.com/*
// @match        https://www.chatpdf.com/*
// @match        https://www.perplexity.ai/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(async function () {
  ("use strict");
  let cpeDisabled = GM_getValue("cpeDisabled", false);

  const selectors = {
    openai: "#prompt-textarea",
    phind: 'textarea[aria-label="Send message"]',
    google: '[aria-label="Input for prompt text"]',
    poe: "textarea",
    chatpdf: "textarea",
    perplexity: "textarea",
  };
  const site = /:\/\/(.*?\.)?([^./]+)\.[^/]+/.exec(document.location.href)[2];
  let promptTextArea;
  let attemptCount = 0;
  findTextareaAndSetUpListener();

  function findTextareaAndSetUpListener() {
    promptTextArea = document.querySelector(selectors[site]);

    if (!promptTextArea) {
      if (attemptCount < 3) {
        attemptCount++;
        console.log(`Could not find textarea for site: ${site}. trying again`);
        setTimeout(findTextareaAndSetUpListener, 5000);
      } else {
        console.error(`Could not find textarea for site: ${site}`);
      }
      return;
    } else {
      console.log(`Found textarea for site: ${site}.`);
      toggleTextareaListener(false);
    }
  }

  // Function to handle the textarea behavior
  function handleCtrlEnter(event) {
    if (event.code !== "Enter") {
      return;
    }

    const isOnlyEnter = !event.ctrlKey && !event.metaKey;
    const isCtrlEnter = event.ctrlKey && event.code === "Enter";

    if (isOnlyEnter) {
      console.warn("Enter key pressed without Ctrl");
      event.stopPropagation();
    } else if (isCtrlEnter) {
      console.info("Ctrl+Enter detected, simulating Enter key press");
      event.preventDefault();
      const newEvent = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
        code: "Enter",
        ctrlKey: false,
        metaKey: true,
      });
      event.target.dispatchEvent(newEvent);
    }
  }

  // Function to add or remove the event listener based on the feature's state
  function toggleTextareaListener(cpeDisabled) {
    if (!cpeDisabled) {
      // If feature is enabled and event listener is not already added, add the event listener
      promptTextArea.addEventListener("keydown", handleCtrlEnter, {
        capture: true,
      });
    } else {
      // If feature is disabled and event listener is already added, remove the event listener
      promptTextArea.removeEventListener("keydown", handleCtrlEnter, {
        capture: true,
      });
    }
  }
  //cpeDisabled = true
  registerMenu();
  function registerMenu() {
    const menuIDs = []; // empty to store newly registered cmds for removal while preserving order
    const state = {
      symbol: ["✔️", "❌"],
      word: ["ON", "OFF"],
      separator: " — ",
    };

    const cpeLabel =
      state.symbol[+cpeDisabled] +
      "Toggle Ctrl + Enter" +
      state.separator +
      state.word[+cpeDisabled];
    menuIDs.push(
      GM_registerMenuCommand(cpeLabel, () => {
        notify(`CTRL+Enter Sender ${cpeDisabled ? "Enabled" : "Disabled"}`);
        GM_setValue("cpeDisabled", !cpeDisabled); //init false, setting true
        toggleTextareaListener(!cpeDisabled);
        cpeDisabled = !cpeDisabled; //init false, setting true

        for (const id of menuIDs) {
          GM_unregisterMenuCommand(id);
        }
        registerMenu();
      })
    );
  }

  function notify(message, duration = 3000) {
    // Create a custom notification element
    const notificationElement = document.createElement("div");
    notificationElement.classList.add("custom-notification");

    // Set the accent color (ocean blue - 3498db)
    const accentColor = "#3498db";

    // Set the progress bar color (purple - 8e44ad)
    const progressBarColor = "#6364ab";

    // Set styles for the notification
    notificationElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 15px;
        background-color: #333; /* Dark background color */
        color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); /* Box shadow for depth */
        z-index: 9999;
        transition: opacity 0.3s ease-in-out;
        /* border-left: 5px solid ${accentColor};  Accent color border */
        overflow: hidden; /* Hide overflowing progress bar */
    `;

    // Set styles for the notification text
    const textElement = document.createElement("div");
    textElement.style.cssText = `
        font-size: 16px;
        line-height: 1.4;
    `;

    // Add the notification text
    textElement.textContent = message;

    // Add the text element to the notification
    notificationElement.appendChild(textElement);

    // Set styles for the progress bar
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
        height: 4px;
        width: 100%;
        background-color: ${progressBarColor};
        position: absolute;
        bottom: 0;
        left: 0;
    `;

    // Add the progress bar to the notification
    notificationElement.appendChild(progressBar);

    // Add the notification element to the document
    document.body.appendChild(notificationElement);

    // Allow some time for the styles to be applied before fading in
    setTimeout(() => {
      notificationElement.style.opacity = "1";
    }, 100);

    // Start the animation
    let start;
    function step(timestamp) {
      if (!start) start = timestamp;
      let progress = timestamp - start;
      let width = 100 - (100 / duration) * progress;
      progressBar.style.width = width + "%";

      if (progress < duration) {
        window.requestAnimationFrame(step);
      }
    }
    window.requestAnimationFrame(step);

    // Set a timeout to remove the notification element
    setTimeout(() => {
      // Fade out and remove the notification
      notificationElement.style.opacity = "0";
      setTimeout(() => {
        notificationElement.remove();
      }, 300);
    }, duration);
  }
})();
