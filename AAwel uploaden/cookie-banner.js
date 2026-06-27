(function() {
  var STORAGE_KEY = 'cookie_consent_v3';
  var STRINGS = {
    nl: {
      cookie_title: 'Cookies',
      cookie_text: 'We gebruiken noodzakelijke cookies en lokale opslag om de website te laten werken, je taalkeuze te onthouden en je toestemmingskeuze op te slaan.',
      cookie_more: 'Meer info',
      cookie_accept: 'Accepteren',
      cookie_decline: 'Weigeren'
    },
    fr: {
      cookie_title: 'Cookies',
      cookie_text: 'Nous utilisons des cookies nécessaires et du stockage local pour faire fonctionner le site, mémoriser votre langue et enregistrer votre choix.',
      cookie_more: 'Plus d\'infos',
      cookie_accept: 'Accepter',
      cookie_decline: 'Refuser'
    },
    en: {
      cookie_title: 'Cookies',
      cookie_text: 'We use necessary cookies and local storage to make the website work, remember your language choice and store your consent choice.',
      cookie_more: 'More info',
      cookie_accept: 'Accept',
      cookie_decline: 'Decline'
    }
  };

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) { return null; }
  }
  function setConsent(choice) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: choice, date: new Date().toISOString() }));
  }
  function t(k) {
    var lang = localStorage.getItem('preferredLang') || document.documentElement.lang || 'nl';
    var strings = STRINGS[lang] || STRINGS.nl;
    return strings[k] || STRINGS.nl[k] || k;
  }
  function showBanner() {
    if (getConsent()) return;
    var lang = localStorage.getItem('preferredLang') || document.documentElement.lang || 'nl';
    var div = document.createElement('div');
    div.id = 'cookie-banner';
    div.innerHTML = '<div style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e2e8f0;box-shadow:0 -4px 20px rgba(0,0,0,0.08);z-index:9999;padding:16px 20px;font-family:system-ui,sans-serif;font-size:14px;color:#334155;">' +
      '<div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;">' +
      '<div style="flex:1;min-width:260px;line-height:1.5;">' +
      '<strong style="color:#1e293b;">' + t('cookie_title') + ' 🍪</strong><br>' + t('cookie_text') +
      ' <a href="cookies.html" style="color:#059669;text-decoration:underline;">' + t('cookie_more') + '</a><br>' +
      '<a href="#" id="cookie-reset-link" style="display:inline-block;margin-top:6px;color:#475569;text-decoration:underline;font-size:12px;">' +
      (lang === 'fr' ? 'Réinitialiser le choix' : lang === 'en' ? 'Reset choice' : 'Cookiekeuze herstellen') +
      '</a></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button id="cookie-decline" style="padding:8px 16px;border:1px solid #cbd5e1;background:#fff;color:#475569;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">' + t('cookie_decline') + '</button>' +
      '<button id="cookie-accept" style="padding:8px 16px;border:none;background:#059669;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">' + t('cookie_accept') + '</button>' +
      '</div></div></div>';
    document.body.appendChild(div);
    document.getElementById('cookie-accept').addEventListener('click', function() { setConsent('all'); div.remove(); });
    document.getElementById('cookie-decline').addEventListener('click', function() { setConsent('necessary'); div.remove(); });
    var resetLink = document.getElementById('cookie-reset-link');
    if (resetLink) {
      resetLink.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem(STORAGE_KEY);
        div.remove();
        showBanner();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
  else showBanner();
})();
