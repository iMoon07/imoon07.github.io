/* References hub: left nav, breadcrumb, pager, command search (Ctrl+K), mobile drawers. */
(function () {
  'use strict';
  var modules = Array.isArray(window.REFERENCE_MODULES) ? window.REFERENCE_MODULES.slice() : [];
  if (!modules.length) return;

  var nav = document.getElementById('docs-nav');
  var navMobile = document.getElementById('docs-nav-mobile');
  if (nav) nav.innerHTML = '<p class="text-dim text-sm p-4">References data not loaded yet. <strong>SOON update</strong>.</p>';
  if (navMobile) navMobile.innerHTML = '<p class="text-dim text-sm p-4">References data not loaded yet. <strong>SOON update</strong>.</p>';
})();
