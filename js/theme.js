/* SKORIN — mode terang/gelap. Dimuat di <head> supaya tema terpasang sebelum halaman tampil (tanpa kedip). */
(() => {
  'use strict';
  const KEY = 'ss_theme';
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const root = document.documentElement;
  const apply = t => root.setAttribute('data-theme', t);
  apply(read() === 'light' ? 'light' : 'dark');

  function paint(btn) {
    const light = root.getAttribute('data-theme') === 'light';
    btn.innerHTML = `<span aria-hidden="true">${light ? '🌙' : '☀️'}</span><b>${light ? 'Gelap' : 'Terang'}</b>`;
    btn.setAttribute('aria-label', light ? 'Ganti ke mode gelap' : 'Ganti ke mode terang');
    btn.setAttribute('aria-pressed', String(light));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    paint(btn);
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* diblokir */ }
      paint(btn);
    });
    const bar = document.querySelector('.top-right');
    if (bar) bar.appendChild(btn);
    else { btn.classList.add('theme-fab'); document.body.appendChild(btn); } // halaman login
  });
})();
