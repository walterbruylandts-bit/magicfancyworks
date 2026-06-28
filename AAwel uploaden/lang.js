(function() {
  const STORAGE_KEY = "site_lang_v3";
  const I18N = {
    nl: {
      physical: "Fysiek product", digital: "Digitaal patroon",
      delivery_p: "Fysieke producten worden binnen 10 werkdagen verzonden.",
      delivery_d: "Digitale bestanden worden binnen 72 uur per email bezorgd na goedkeuring.",
      checkout: "Afrekenen", thanks_p: "Bedankt! Je bestelling wordt binnen 10 werkdagen verzonden.",
      thanks_d: "Bedankt! Je ontvangt een email met je download.", confirm: "Een bevestiging is verstuurd.",
      cookie_title: "Cookies", cookie_text: "We gebruiken cookies om je ervaring te verbeteren.",
      cookie_more: "Meer info", cookie_accept: "Accepteren", cookie_decline: "Weigeren",
      choose: "Kies je taal"
    },
    fr: {
      physical: "Produit physique", digital: "Motif numérique",
      delivery_p: "Les produits physiques sont expédiés sous 10 jours ouvrables.",
      delivery_d: "Les fichiers numériques sont livrés par email dans les 72 heures après approbation.",
      checkout: "Payer", thanks_p: "Merci! Votre commande sera expédiée sous 10 jours ouvrables.",
      thanks_d: "Merci! Vous recevrez un email avec votre téléchargement.", confirm: "Une confirmation a été envoyée.",
      cookie_title: "Cookies", cookie_text: "Nous utilisons des cookies pour améliorer votre expérience.",
      cookie_more: "Plus d'infos", cookie_accept: "Accepter", cookie_decline: "Refuser",
      choose: "Choisissez votre langue"
    },
    en: {
      physical: "Physical product", digital: "Digital pattern",
      delivery_p: "Physical products will be shipped within 10 business days.",
      delivery_d: "Digital files will be delivered by email within 72 hours after approval.",
      checkout: "Checkout", thanks_p: "Thank you! Your order will be shipped within 10 business days.",
      thanks_d: "Thank you! You will receive an email with your download.", confirm: "A confirmation has been sent.",
      cookie_title: "Cookies", cookie_text: "We use cookies to improve your experience.",
      cookie_more: "More info", cookie_accept: "Accept", cookie_decline: "Decline",
      choose: "Choose your language"
    }
  };

  window.currentLang = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("preferredLang") || null;
  window.I18N = I18N;
  window.t = function(k) {
    const lang = window.currentLang || 'nl';
    return (I18N[lang] && I18N[lang][k]) || I18N['nl'][k] || k;
  };

  window.setLang = function(lang) {
    window.currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem("preferredLang", lang);
    location.reload();
  };

  function showLangModal() {
    if (window.currentLang) return;
    const overlay = document.createElement('div');
    overlay.id = 'lang-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#fff;padding:32px;border-radius:16px;text-align:center;max-width:360px;width:90%;font-family:system-ui,sans-serif;">' +
      '<h2 style="margin:0 0 8px;color:#1e293b;">MagicFancyworks</h2>' +
      '<p style="margin:0 0 20px;color:#64748b;font-size:14px;">' + I18N.nl.choose + '</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<button onclick="window.setLang(\'nl\')" style="padding:12px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;cursor:pointer;font-size:15px;font-weight:500;">🇳🇱 Nederlands</button>' +
      '<button onclick="window.setLang(\'fr\')" style="padding:12px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;cursor:pointer;font-size:15px;font-weight:500;">🇫🇷 Français</button>' +
      '<button onclick="window.setLang(\'en\')" style="padding:12px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;cursor:pointer;font-size:15px;font-weight:500;">🇬🇧 English</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
  }

  function addSwitcher() {
    if (document.getElementById('lang-switch')) return;
    const div = document.createElement('div');
    div.id = 'lang-switch';
    div.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9999;display:flex;gap:4px;background:#fff;padding:4px 6px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.1);font-family:system-ui;font-size:12px;font-weight:600;';
    ['nl','fr','en'].forEach(function(code) {
      const btn = document.createElement('button');
      btn.textContent = code.toUpperCase();
      var isActive = code === (window.currentLang || 'nl');
      btn.style.cssText = isActive
        ? 'border:none;background:#059669;color:#fff;padding:3px 8px;border-radius:4px;cursor:pointer;'
        : 'border:none;background:transparent;color:#64748b;padding:3px 8px;border-radius:4px;cursor:pointer;';
      btn.onclick = function() { if (code !== window.currentLang) window.setLang(code); };
      div.appendChild(btn);
    });
    document.body.appendChild(div);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { showLangModal(); addSwitcher(); });
  } else {
    showLangModal(); addSwitcher();
  }
})();
