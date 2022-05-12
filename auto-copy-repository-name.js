// ==UserScript==
// @name         Auto-Copy-Github-Repository-Name
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  copy github repository name when deleteing a repository
// @author       kkopite
// @match        https://github.com/**/*/settings
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const pathname = window.location.pathname
  const index = pathname.lastIndexOf('/settings')
  const name = pathname.slice(1, index)
  navigator.clipboard.writeText(name)

})();
