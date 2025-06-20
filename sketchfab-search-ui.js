// Import fetchPage directly for modularity and clarity
import { fetchPage } from './sketchfab-search.js';
import { renderDownloadedModels } from './model-list-ui.js';

// Expose a global UI render function for use by sketchfab-search.js
window.renderSketchfabSearchResultsUI = function (
  resultsDiv,
  results,
  nextUrl,
  prevUrl,
  downloadedUids,
  downloadAndSaveModel
) {
  resultsDiv.innerHTML = '';
  if (!results || results.length === 0) {
    resultsDiv.textContent = 'No models found.';
    return;
  }
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
        licensed under <a href="${model.licenseUrl || '#'}" target="_blank" rel="noopener">${model.license.label || 'Unknown License'}</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
      </span>
    `;
    const el = document.createElement('div');
    el.className = 'sketchfab-result'; // Use the correct card class for grid
    let downloadHtml = '';
    let sizeMB = smallestGlb ? (smallestGlb.size / (1024 * 1024)).toFixed(2) : '';
    if (glbFiles) {
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
    if (glbFiles && !downloadedUids.has(model.uid)) {
      el.querySelector('.sketchfab-result-download').addEventListener('click', async () => {
        const btn = el.querySelector('.sketchfab-result-download');
        btn.textContent = 'Downloading...';
        btn.disabled = true;
        try {
          await downloadAndSaveModel(model, smallestGlb);
          renderDownloadedModels();
          btn.textContent = 'Downloaded';
          var url = location.href;               //Save down the URL without hash.
          location.href = "#sidebar";                 //Go to the target element.
          history.replaceState(null, null, url);   //Don't like hashes. Changing it back.
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

  // Pagination controls in a full-width wrapper div
  const paginationWrapper = document.createElement('div');
  paginationWrapper.className = 'sketchfab-pagination-wrapper';

  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'sketchfab-pagination';

  if (prevUrl) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.id = 'sketchfab-pagination-prev';
    prevBtn.setAttribute('aria-label', 'Previous page');
    prevBtn.addEventListener('click', () => {
      console.log('Pagination button clicked: Previous', prevUrl);
      fetchPage(prevUrl, resultsDiv);
    });
    paginationDiv.appendChild(prevBtn);
  }
  if (nextUrl) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.id = 'sketchfab-pagination-next';
    nextBtn.setAttribute('aria-label', 'Next page');
    nextBtn.addEventListener('click', () => {
      console.log('Pagination button clicked: Next', nextUrl);
      fetchPage(nextUrl, resultsDiv);
    });
    paginationDiv.appendChild(nextBtn);
  }
  paginationWrapper.appendChild(paginationDiv);
  resultsDiv.appendChild(paginationWrapper);
};
