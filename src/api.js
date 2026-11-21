async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`)
  return data
}

export const api = {
  listPages: () => request('/api/pages'),
  getPage: (id) => request(`/api/pages/${id}`),
  analyze: (prompt) => request('/api/analyze', { method: 'POST', body: JSON.stringify({ prompt }) }),
  modify: (pageId, prompt) => request('/api/modify', { method: 'POST', body: JSON.stringify({ pageId, prompt }) }),
  deletePage: (id) => request(`/api/pages/${id}`, { method: 'DELETE' }),
  updatePage: (id, title) => request(`/api/pages/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),
  getConfig: () => request('/api/config'),
  saveConfig: (config) => request('/api/config', { method: 'POST', body: JSON.stringify(config) }),
  htmlUrl: (id) => `/api/pages/${id}/html`,
}
