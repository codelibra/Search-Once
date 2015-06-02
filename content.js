/**
 * Content script has access to page dom
 * It interacts with backgroung scripts through event binding
 * Event name: GetCurrentPageTitleFromDOM, action: returns title of the page from the DOM
 */

"use strict";

var chrome = chrome || {};

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		var title = "";

		if (request.command == "GetCurrentPageTitleFromDOM") {
			title = document.title;
			sendResponse(title);
		}
	});