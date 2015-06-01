ta/**
 * This script will be running  in the background and will collect the complete information
 * about what all pages the user visits and using what search terms.
 * Then it will generate some data structure which will be used to search in future the related pages
 * The script will use the chrome local storage api
 * https://developer.chrome.com/extensions/storage
 */

"use strict";

/**
 * This is a hack which is used to load the tagger.js script in order to generate the tags.
 * http://stackoverflow.com/questions/9515704/building-a-chrome-extension-inject-code-in-a-page-using-a-content-script/9517879#9517879
 */
var s = document.createElement('script');
s.src = chrome.extension.getURL('tagger.js');
s.onload = function() {
  this.parentNode.removeChild(this);
};
(document.head || document.documentElement).appendChild(s);


var chrome = chrome || {};
var app = app || {};

/**
 * Will be used to respond to various events.
 * @param  {[type]} tabId      which tabId is updated
 * @param  {[type]} changeInfo loading/completed
 * @param  {[type]} tab)       the complete tab object
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  // Not considering the event calls when the page is still loading.
  if (changeInfo && changeInfo.status == 'complete' && tab && tab.url != 'chrome://newtab/') {
    // figure out the type of navigation and perform the steps accordingly

    /*
     * handle google searches diffrently
     * since every google search has 'Google Search' it is easy to distinguish
     * steps:-
     * extract search terms
     * generate tags
     * store tabId: tags in the destoyable ds
     */
    console.log(tab);

    getTitleOfPageFromDOM(tab.id, function(title) {
      if (title.indexOf('Google Search') != -1) {
        // TODO: Find a way for figuring out the search tags from the google search url
        // the search is not always the titile of the page
        var searchText = new FilterStopWords(title);
        var generatedTags = searchText.generateTags();

        if (!generatedTags || generatedTags.length === 0) {
          //when all the search terms were cleared as stopwords
          generatedTags = title;
        }
        saveChangesToDestroyable({
          tabId: tab.id,
          tags: generatedTags
        });
      } else if (tab.openerTabId) {
        console.log("new tab opened " + tab.openerTabId + ' ' + tab.id);
        /**
         * figure out the tags of the opener id and then save the same for the current tab.
         * if the openeer tabId does not exist in the destoyable then return,
         */
        chrome.storage.local.get('Destroyable', function(items) {
          var parentTags = handleGetDestroyable(items.Destroyable, tab.openerTabId);
          if (parentTags == -1) return;
          // changes to persistable must be made only when destroyable save has returned
          var completeDestroyableChanges = new Promise(function() {
            saveChangesToDestroyable({
              tabId: tab.id,
              tags: parentTags
            });
          });
          completeDestroyableChanges.then(saveChangesToPersistable({
            url: tab.url,
            tags: parentTags
          }));
        });
      } else {
        console.log('same tab changed ' + tab.id);
        /**
         * Add this url to and the search tags to the base datastructure.
         * No changes to the destroyable are required.
         */
        chrome.storage.local.get('Destroyable', function(items) {
          var parentTags = handleGetDestroyable(items.Destroyable, tab.id);
          if (parentTags == -1) return;
          saveChangesToPersistable({
            url: tab.url,
            tags: parentTags
          });
        });

      }

    });



  }
});

/**
 * when a particular tab is closed removing the tabId from the destroyable datastructure.
 */
chrome.tabs.onRemoved.addListener(function callback(tabId, removeInfo) {
  removeTabFromDestroyable(tabId);
});

function removeTabFromDestroyable(tabId) {

  chrome.storage.local.get('Destroyable', function(allItems) {

    allItems = allItems.Destroyable;
    for (var index = 0; index < allItems.length; ++index) {
      if (allItems[index].tabId == tabId) {
        allItems.splice(index, 1);
        break;
      }
    }
    chrome.storage.local.set({
      'Destroyable': allItems
    }, function() {
      console.log('Destroyable saved on tab close');
    });

  });

}

function handleSaveDestroyable(allItems, newObject) {

  if (Object.keys(allItems).length === 0) {
    //is empty newObject
    allItems = [];
    allItems.push(newObject);
  } else {
    //service always returns an object
    allItems = allItems.Destroyable;
    // if the tabId is already present then update else add
    for (var index = 0; index < allItems.length; ++index) {
      if (allItems[index].tabId == newObject.tabId) {
        allItems.splice(index, 1);
        break;
      }
    }
    allItems.push(newObject);
  }

  // Save it using the Chrome extension storage API.
  chrome.storage.local.set({
    'Destroyable': allItems
  }, function() {
    console.log('Destroyable saved');
  });
}

function saveChangesToDestroyable(newObject) {
  /**
   * newObject will be of the form
   * tabID : [tags]
   * Expexted behaviour:
   * if the tabId is already present then replace the tags with the new ones.
   * if the tabId is not present then add this newObject the existing ds.
   */

  if (!newObject && !newObject.tabId && !newObject.tags) {
    console.log('Error: No value specified');
    return;
  }

  chrome.storage.local.get('Destroyable', function(items) {
    handleSaveDestroyable(items, newObject);
  });
}

function handleGetDestroyable(allItems, tabId) {
  for (var index = 0; index < allItems.length; ++index) {
    if (allItems[index].tabId == tabId) {
      return allItems[index].tags;
    }
  }
  // if no information about the tag is present
  return -1;
}

function handleSavePersistable(allItems, newObject) {

  /**
   * A particular tag is present in a list of tags or not
   */
  var isTagPresnet = function(items, newTag) {

    if (items.indexOf(newTag) != -1) {
      return true;
    } else {
      return false;
    }
  }
  var updated = false;
  if (Object.keys(allItems).length === 0) {
    //is empty newObject
    allItems = [];
    allItems.push(newObject);
  } else {
    //service always returns an object
    allItems = allItems.Persistable;
    // if the url is already present then update else add
    for (var index = 0; index < allItems.length; ++index) {
      if (allItems[index].url == newObject.url) {
        newObject.tags.forEach(function(newTag) {
          if (!isTagPresnet(allItems[index].tags, newTag))
            allItems[index].tags.push(newTag);
        });
        updated = true;
        break;
      }
    }
    if (!updated) {
      allItems.push(newObject);
    }
  }
  // Save it using the Chrome extension storage API.
  chrome.storage.local.set({
    'Persistable': allItems
  }, function() {
    console.log('Persistable saved');
  });

}

function saveChangesToPersistable(newObject) {
  /**
   * newObject will of the form
   * url : [tags]
   * Expexted behaviour:
   * if the url is not present then create a new entry for the same.
   * if the url is already present then, update the tags if any new tags appear.
   */

  chrome.storage.local.get('Persistable', function(items) {
    handleSavePersistable(items, newObject);
  });
}

// Gets the title of a page by firing a event: GetCurrentPageTitleFromDOM, that has binding in content script
function getTitleOfPageFromDOM(tabId, callback) {
  chrome.tabs.sendMessage(tabId, {
      command: "GetCurrentPageTitleFromDOM",
    },
    function(title) {
      console.log("Title of page:", title);
      callback(title);
    });
}
