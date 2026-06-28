(function() {
  function updateFooterLinks() {
    var lang = localStorage.getItem('preferredLang') || localStorage.getItem('site_lang_v3') || 'nl';
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
