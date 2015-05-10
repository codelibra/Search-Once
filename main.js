
var browserAction = chrome.browserAction;
/**
 * Used to clear the unread count on the extension icon
 */
function setAllRead() {
    browserAction.setBadgeBackgroundColor({color: [0, 255, 0, 128]});
    browserAction.setBadgeText({text: ' '});   // <-- set text to '' to remove the badge
}
/**
 * Used to set the unread count on extension icon
 * @param {[type]} cnt [description]
 */
function setUnread(cnt) {
    browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 128]});
    browserAction.setBadgeText({text: '' + cnt});
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
  var queryInfo = {
    text:'google'
  };

  chrome.history.search(queryInfo, function(historyItems){
    callback(historyItems);
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
