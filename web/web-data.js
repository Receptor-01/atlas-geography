// Web equivalent of Electron's read-only preload bridge.
window.atlasData = Object.freeze({
  loadGeography: async () => {
    const names = ['topology', 'cities', 'countries', 'populations'];
    try {
      const values = await Promise.all(names.map(async name => {
        const response = await fetch(`data/${name}.json`);
        if (!response.ok) throw new Error(`Unable to load ${name}: ${response.status}`);
        return response.json();
      }));
      return Object.fromEntries(names.map((name, index) => [name, values[index]]));
    } catch (error) {
      const notice = document.createElement('p');
      notice.className = 'load-error';
      notice.setAttribute('role', 'alert');
      notice.textContent = 'The full geography library could not load. Check your connection and reload to play all modes.';
      document.body.append(notice);
      throw error;
    }
  }
});
