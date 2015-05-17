/**
 * This file contains the search class. Given a list of search tags it fetches the relevant links from history,
 * then returns list of string sorted by priority
 * Usage:
 */

"use strict";

var chrome = chrome || {};

var RelevantLinkToPriorityMapper = function(searchTags) {
	this.searchTags = searchTags;
};

RelevantLinkToPriorityMapper.prototype.generateLinkToMetadataMapping = function(callback) {
	var queryInfo = {
		text: ''
	};
	var linkToPriorityMap = new Map();
	var linkMetadata = {
		linkTitle: '',
		tagCount: 0,
		lastVisitedTime: -1,
		visitedCount: -1,
	};
	var latestVisitTime = -1;
	var maxTagCount = -1;
	var maxVisitCount = -1;

	for (var i in this.searchTags) {
		queryInfo.text = this.searchTags[i];
		chrome.history.search(queryInfo, function(historyItems) {
			var totalHistoryItems = historyItems.length;
			var j = 0;
			historyItems.forEach(function(item) {
				var tagFrequency = 0;
				j++;
				var date = new Date();
				date.setFullYear(date.getFullYear() - 1);

				if (item.title !== '' && item.url !== '' && (date.getTime() < item.lastVisitTime)) {

					if (linkToPriorityMap.has(item.url)) {
						tagFrequency = linkToPriorityMap.get(item.url).tagCount++;

						if (maxTagCount < tagFrequency) {
							maxTagCount = tagFrequency;
						}
					} else {
						linkMetadata.linkTitle = item.title;
						linkMetadata.tagCount = 1;
						linkMetadata.lastVisitedTime = item.lastVisitTime;
						linkMetadata.visitedCount = item.visitCount;

						linkToPriorityMap.set(item.url, linkMetadata);

						if (maxTagCount < linkMetadata.tagCount) {
							maxTagCount = linkMetadata.tagCount;
						}
						if (latestVisitTime < item.lastVisitTime) {
							latestVisitTime = item.lastVisitTime;
						}
						if (maxVisitCount < item.visitCount) {
							maxVisitCount = item.visitCount;
						}
					}

				}
				if (j == totalHistoryItems) {
					callback(linkToPriorityMap, latestVisitTime, maxTagCount, maxVisitCount);
				}

			});
		});
	}
};

RelevantLinkToPriorityMapper.prototype.generatePriorityToLinkMap = function() {
	var PriorityToLinkMap = new Map();
	var linkMetadata = {
		url: '',
		title: '',
		lastVisitedTime: -1,
		visitCount: -1,
	};
	this.generateLinkToMetadataMapping(function(linkToPriorityMap, latestVisitTime, maxTagCount, maxVisitCount) {
		var mapIterator = linkToPriorityMap.entries();
		for (var x = 0; x < linkToPriorityMap.size; x++) {
			var mapElement = mapIterator.next().value;

			linkMetadata.url = mapElement[0];
			linkMetadata.title = mapElement[1].linkTitle;
			linkMetadata.lastVisitedTime = mapElement[1].lastVisitedTime;
			linkMetadata.visitCount = mapElement[1].visitedCount;

			var priority = 2*(mapElement[1].tagCount) + (mapElement[1].visitedCount); //- (latestVisitTime - mapElement[1].lastVisitedTime);

			if (!PriorityToLinkMap.has(priority)) {
				PriorityToLinkMap.set(priority, linkMetadata);
			}
		}
	});
};