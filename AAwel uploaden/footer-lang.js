(function() {
  function getStoredLang() {
    var lang = localStorage.getItem('preferredLang') || localStorage.getItem('site_lang_v3') || 'nl';
    return ['nl', 'fr', 'en'].indexOf(lang) !== -1 ? lang : 'nl';
  }

  function updateFooterLinks() {
    var lang = getStoredLang();
    var suffix = lang === 'nl' ? '' : '-' + lang;
    
    var links = {
      'footerContact': '/contact' + suffix + '.html',
      'footerVoorwaarden': '/voorwaarden' + suffix + '.html',
      'footerPrivacy': '/privacy' + suffix + '.html',
      'footerCookies': '/cookies' + suffix + '.html'
    };
    
    for (var id in links) {
      var el = document.getElementById(id);
      if (el) el.href = links[id];
    }
  }
  
  // Direct uitvoeren
  updateFooterLinks();
  
  // Ook uitvoeren als setLang wordt aangeroepen
  var origSetLang = window.setLang;
  if (origSetLang) {
    window.setLang = function(lang) {
      origSetLang(lang);
      setTimeout(updateFooterLinks, 100);
    };
  }
})();
