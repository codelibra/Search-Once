/**
 * This file contains the search class. Given a list of search tags it fetches the relevant links from history,
 * then returns list of string sorted by priority
 * Usage:
 */

var RelevantLinkToPriorityMapper = function(searchTags) {
	this.searchTags = searchTags;
};

RelevantLinkToPriorityMapper.prototype.calculateAndOrderByPriority = function() {

};

RelevantLinkToPriorityMapper.prototype.generateLinkToMetadataMapping = function(callback) {
	var queryInfo = {
		text: ''
	};
	var linkToPriorityMap = {};
	var linkMetadata = {
		linkTitle: '',
		tagCount: 0,
		lastVisitedTime: -1,
		visitedCount: -1,
		priority: -1
	};
	var latestVisitTime = -1;
	var maxTagCount = -1;
	var maxVisitCount = -1;

	for (var i in this.searchTags) {
		queryInfo.text = this.searchTags[i];
		console.log(this.searchTags[i]);

		chrome.history.search(queryInfo, function(historyItems) {
			historyItems.forEach(function(item) {

				var month = -6;
				var date = new Date(Date.now());
				date.setMonth(date.getMonth() + months);

				if (item.title !== '' && item.url !== '' && (date.getMilliseconds() < item.lastVisitTime)) {
					var tagCount;

					if (item.url in linkToPriorityMap) {
						tagCount = linkToPriorityMap[item.url].tagCount++;

						if (maxTagCount < tagCount) {
							maxTagCount = tagCount;
						}
					} else {
						linkMetadata.linkTitle = item.title;
						tagCount = linkMetadata.tagCount++;
						linkMetadata.lastVisitedTime = item.lastVisitTime;
						linkMetadata.visitedCount = item.visitCount;
						linkMetadata.priority = -1;

						linkToPriorityMap[item.url] = linkMetadata;

						if (maxTagCount < tagCount) {
							maxTagCount = tagCount;
						}
						if (latestVisitTime < item.lastVisitTime) {
							latestVisitTime = item.lastVisitTime;
						}
						if (maxVisitCount < item.visitCount) {
							maxVisitCount = item.visitCount;
						}
					}

				}

			});
		});
	}
	callback(linkToPriorityMap, latestVisitTime, maxTagCount, maxVisitCount);
};

RelevantLinkToPriorityMapper.prototype.generatePriorityToLinkMap = function() {
	return this.generateLinkToMetadataMapping(function(linkToPriorityMap, latestVisitTime, maxTagCount, maxVisitCount) {
		for (var i in linkToPriorityMap) {

		}
	});
};