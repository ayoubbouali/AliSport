// Applies the saved theme before Angular boots (avoids a flash of the wrong theme).
try { if (localStorage.getItem('gm-theme') === 'dark') document.documentElement.classList.add('dark'); } catch (e) { /* ignore */ }
