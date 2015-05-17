/**
 * Content script has access to page dom
 * It interacts with backgroung scripts through event binding
 * Event name: GetCurrentPageTitleFromDOM, action: returns title of the page from the DOM  
 */

"use strict";

var chrome = chrome || {};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.command == "GetCurrentPageTitleFromDOM")
      sendResponse(document.title);
  });