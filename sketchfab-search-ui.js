// Remove unused imports

// Expose a global UI render function for use by sketchfab-search.js
window.renderSketchfabSearchResultsUI = function(
  resultsDiv,
  results,
  nextUrl,
  prevUrl,
  downloadedUids,
  downloadAndSaveModel
) {
  resultsDiv.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'sketchfab-results-grid';

  results.forEach(model => {
    // Find the smallest .glb file
    let glbFiles = (model.archives && model.archives.glb) ? model.archives.glb : [];
    let smallestGlb = null;
    if (glbFiles.length) {
      smallestGlb = glbFiles.reduce((min, file) => (!min || file.size < min.size) ? file : min, null);
    }
    const attribution = `
      <span class="skfb-attrib">
        <a href="https://sketchfab.com/3d-models/${model.slug || model.uid}" target="_blank" rel="noopener">${model.name}</a>
        by <a href="${model.user.profileUrl || '#'}" target="_blank" rel="noopener">${model.user.displayName}</a>
        licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
      </span>
    `;
    const el = document.createElement('div');
    el.className = 'sketchfab-result'; // Use the correct card class for grid
    let downloadHtml = '';
    let sizeMB = smallestGlb ? (smallestGlb.size / (1024 * 1024)).toFixed(2) : '';
    if (smallestGlb) {
      downloadHtml = `
        <button class="sketchfab-result-download" data-glb-idx="${glbFiles.indexOf(smallestGlb)}">${downloadedUids.has(model.uid) ? 'Downloaded' : 'Download'}</button>
      `;
    } else {
      downloadHtml = '<div class="sketchfab-result-size skfb-unavailable">No .glb available</div>';
    }
    el.innerHTML = `
      <img src="${model.thumbnails.images[0].url}" alt="${model.name}" class="sketchfab-result-thumb" loading="lazy" />
      <div class="sketchfab-result-download-cell">${downloadHtml}</div>
      <div class="sketchfab-result-attribution">${attribution}</div>
      <div class="sketchfab-result-size">${sizeMB} MB</div>
    `;
    if (smallestGlb && !downloadedUids.has(model.uid)) {
      el.querySelector('.sketchfab-result-download').addEventListener('click', async () => {
        const btn = el.querySelector('.sketchfab-result-download');
        btn.textContent = 'Downloading...';
        btn.disabled = true;
        try {
          await downloadAndSaveModel(model, smallestGlb);
          btn.textContent = 'See My Models';
          btn.disabled = false;
          btn.classList.remove('sketchfab-result-download');
          btn.classList.add('sketchfab-result-goto');
          btn.onclick = () => window.location.href = 'models.html';
        } catch (e) {
          alert('Download failed: ' + e.message);
          btn.textContent = 'Download';
          btn.disabled = false;
        }
      });
    }
    grid.appendChild(el);
  });
  resultsDiv.appendChild(grid);

  // Pagination controls in a full-width wrapper div (no inline styles)
  const paginationWrapper = document.createElement('div');
  paginationWrapper.className = 'sketchfab-pagination-wrapper';

  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'sketchfab-pagination';

  // Use only window.fetchPage for pagination
  function handlePage(url) {
    if (window.fetchPage) {
      window.fetchPage(url, resultsDiv);
    }
  }

  if (prevUrl) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.onclick = () => handlePage(prevUrl);
    paginationDiv.appendChild(prevBtn);
  }
  if (nextUrl) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.onclick = () => handlePage(nextUrl);
    paginationDiv.appendChild(nextBtn);
  }
  paginationWrapper.appendChild(paginationDiv);
  resultsDiv.appendChild(paginationWrapper);

  // Change Downloaded button to 'My Models' and style as outlined
  Array.from(document.querySelectorAll('.sketchfab-result-download')).forEach(btn => {
    if (btn.textContent === 'Downloaded') {
      btn.textContent = 'My Models';
      btn.classList.remove('sketchfab-result-download');
      btn.classList.add('sketchfab-result-mymodels');
      btn.disabled = false;
      btn.onclick = () => window.location.href = 'models.html';
    }
  });
};
