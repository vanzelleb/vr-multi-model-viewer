// Sketchfab API calls (search, download info, pagination)
import { getAccessToken } from './sketchfab-auth.js';

export async function searchSketchfabApi(query, page = 1) {
  const token = getAccessToken();
  if (!token) throw new Error('No access token');
  const url = `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true&restricted=true&sort_by=likeCount&file_format=glb&archives_flavours=true&count=24${page > 1 ? `&cursor=${(page-1)*24}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch search results');
  return await res.json();
}

export async function fetchDownloadInfo(modelUid) {
  const token = getAccessToken();
  if (!token) throw new Error('No access token');
  const res = await fetch(`https://api.sketchfab.com/v3/models/${modelUid}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to get download info');
  return await res.json();
}

export async function fetchPaginatedResults(url) {
  const token = getAccessToken();
  if (!token) throw new Error('No access token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch page');
  return await res.json();
}
