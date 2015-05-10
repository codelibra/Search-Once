/**
 * Get the tab.
 *
 * @param {function(string)} callback - called when current search is found.
 **/
function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
     // since only one tab should be active and in the current window at once
     // the return variable should only have one entry
     var activeTab   = tabs[0];
     //using the url of the current serach find the correct search terms
     var activeURL   = activeTab.url;
     callback(activeURL);
  });
}


/**
 * Used to clear the unread count on the extension icon
 */
function setAllRead() {
    var browserAction = chrome.browserAction;
    browserAction.setBadgeBackgroundColor({color: [0, 255, 0, 128]});
    browserAction.setBadgeText({text: ' '});   // <-- set text to '' to remove the badge
}
/**
 * Used to set the unread count on extension icon
 * @param {[type]} cnt [description]
 */
function setUnread(cnt) {
    var browserAction = chrome.browserAction;
    browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 128]});
    browserAction.setBadgeText({text: '' + cnt});
}

/**
 *  generate the search text using the url of the active page
 *  Logic used:
 *  1. find the text 'q=' from the beginning of the url and the end
 *  2. find the text '&'
 *  3. If the search is made using google or omibox url will have search terms
 *     either from the first q= to & or from the last q= to the end of the url
 *  @return search terms
 */
function generateSearchText(url) {

    if (url.indexOf("www.google") != -1) {
      var start     = url.indexOf('q=');
      var end       = url.lastIndexOf('q=');
      var delimiter = url.indexOf('&');

      if (start != end) {
        searchText = url.slice(start + 2, delimiter) + '+' + url.slice(end + 2);
      } else {
        searchText = url.slice(start + 2, delimiter);
      }
      console.log('Searching history for:' + searchText);
    }
    return searchText;
  }

/**
 * change the text of the elemet found
 **/
function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

/**
 * Sends the complete history list.
 * @param  {Function} callback called after the history has been fetched.
 */
function getCompleteHistory(callback){
  /**
   * https://developer.chrome.com/extensions/history
   * @type {Object}
   */
   var searchText = '';
   //using the current tab url generate the search term and then search the history
   getCurrentTabUrl(function(url){
      searchText = generateSearchText(url);
      var queryInfo = {
        text: searchText
      };

      chrome.history.search(queryInfo, function(historyItems){
        callback(historyItems);
      });

   });
}


/**
 * This is the starting point of the script and is executed when DOM is loaded.
 * Search in the history the list of releavant pages
 */
document.addEventListener('DOMContentLoaded',function() {

var list        = document.getElementById('all-history');
var unreadCount = 0;
getCompleteHistory(function(historyItems){

  historyItems.forEach(function(item){

    if( item.title!=='' && item.url!==''){

      var entry             = document.createElement('li');
      var entryAnchor       = document.createElement('a');
      entryAnchor.target    = '_blank';
      entryAnchor.href      = item.url;
      entryAnchor.innerHTML = item.title;
      entry.appendChild(entryAnchor);
      list.appendChild(entry);
      unreadCount ++;
  }

  });
  setUnread(unreadCount);
});

});
