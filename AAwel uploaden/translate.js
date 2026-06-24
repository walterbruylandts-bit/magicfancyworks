(function() {
  var lang = localStorage.getItem('site_lang_v3') || 'nl';
  if (lang === 'nl') return;

  var T = {
    fr: {
      physical: "Produit physique", digital: "Motif numérique",
      delivery_p: "Les produits physiques sont expédiés sous 10 jours ouvrables.",
      delivery_d: "Les fichiers numériques sont livrés par email dans les 72 heures après approbation.",
      checkout: "Payer", 
      thanks_p: "Merci! Votre commande sera expédiée sous 10 jours ouvrables.",
      thanks_d: "Merci! Vous recevrez un email avec votre téléchargement.", 
      confirm: "Une confirmation a été envoyée.",
      error: "Erreur", cancelled: "Annulé", paypal_error: "Erreur PayPal", 
      paypal_not_loaded: "PayPal non chargé", view_details: "Voir détails"
    },
    en: {
      physical: "Physical product", digital: "Digital pattern",
      delivery_p: "Physical products will be shipped within 10 business days.",
      delivery_d: "Digital files will be delivered by email within 72 hours after approval.",
      checkout: "Checkout", 
      thanks_p: "Thank you! Your order will be shipped within 10 business days.",
      thanks_d: "Thank you! You will receive an email with your download.", 
      confirm: "A confirmation has been sent.",
      error: "Error", cancelled: "Cancelled", paypal_error: "PayPal error", 
      paypal_not_loaded: "PayPal not loaded", view_details: "View details"
    }
  };

  var t = T[lang];
  if (!t) return;

  var map = [
    ['Fysiek product', t.physical],
    ['Digitaal patroon', t.digital],
    ['Fysieke producten worden binnen 10 werkdagen verzonden.', t.delivery_p],
    ['Digitale bestanden worden binnen 72 uur per email bezorgd na goedkeuring.', t.delivery_d],
    ['Afrekenen', t.checkout],
    ['Je bestelling wordt binnen 10 werkdagen verzonden.', t.thanks_p],
    ['Je ontvangt een email met je download.', t.thanks_d],
    ['Een bevestiging is verstuurd.', t.confirm],
    ['Bekijk details', t.view_details],
    ['Fout', t.error],
    ['Geannuleerd', t.cancelled],
    ['PayPal fout', t.paypal_error],
    ['PayPal niet geladen', t.paypal_not_loaded]
  ];

  // ALLEEN text nodes aanpassen - NOOIT elementen zelf
  function translateTextNodes() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while (node = walker.nextNode()) {
      var val = node.nodeValue;
      if (!val || !val.trim()) continue;
      for (var i = 0; i < map.length; i++) {
        if (val.indexOf(map[i][0]) !== -1) {
          node.nodeValue = val.split(map[i][0]).join(map[i][1]);
        }
      }
    }
  }

  // Producttitels via de render functie
  function translateProducts() {
    if (!window.alleProducten) return;
    window.alleProducten.forEach(function(p) {
      if (!p._orig) p._orig = p.titel;
      if (lang === 'fr' && p.titel_fr) p.titel = p.titel_fr;
      else if (lang === 'en' && p.titel_en) p.titel = p.titel_en;
      else p.titel = p._orig;
    });
    if (typeof renderProducten === 'function') renderProducten();
  }

  function run() {
    translateProducts();
    translateTextNodes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      run();
      setTimeout(run, 1000);
    });
  } else {
    run();
    setTimeout(run, 1000);
  }

})();
