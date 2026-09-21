export const METRICS = [
  ['idempotent', 'Idempotent'], ['declarative', 'Declarative'], ['query', 'Query'],
  ['execution', 'Execution'], ['modularity', 'Modularity'], ['documentation', 'Documentation'],
];
export const COLUMNS = ['tool', ...METRICS.map(([key]) => key), 'category', 'demos', 'evidence', 'score_source', 'notes'];

export function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else if (!quoted && field.length) throw new Error('Unexpected quote in CSV field');
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); if (row.some(cell => cell !== '')) rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('Unclosed quote in CSV');
  if (row.length || field) { row.push(field); rows.push(row); }
  return rows;
}

export function parseMatrix(text) {
  const [headers, ...rows] = parseCSV(text);
  if (!headers || headers.join(',') !== COLUMNS.join(',')) throw new Error('Unexpected tool-matrix.csv columns');
  if (!rows.length) throw new Error('The CSV has no tools');
  const seen = new Set();
  return rows.map((cells, i) => {
    if (cells.length !== COLUMNS.length) throw new Error(`Row ${i + 2}: incorrect column count`);
    const tool = Object.fromEntries(COLUMNS.map((key, j) => [key, cells[j].trim()]));
    if (!tool.tool || seen.has(tool.tool.toLowerCase())) throw new Error(`Row ${i + 2}: empty or duplicate tool`);
    seen.add(tool.tool.toLowerCase());
    for (const [key] of METRICS) {
      const value = tool[key];
      if (value === '') tool[key] = null;
      else if (!/^(?:10|[0-9])(?:\.\d+)?$/.test(value) || Number(value) > 10) throw new Error(`${tool.tool}: ${key} must be blank or 0-10`);
      else tool[key] = Number(value);
    }
    if (!tool.category || !tool.evidence || !tool.score_source) throw new Error(`${tool.tool}: missing provenance`);
    return tool;
  });
}

export function isScored(tool) { return METRICS.every(([key]) => tool[key] !== null); }
export function filterTools(tools, selected, category = '', query = '') {
  return tools.filter(tool => selected.has(tool.tool) && (!category || tool.category === category)
    && `${tool.tool} ${tool.demos} ${tool.notes}`.toLowerCase().includes(query.toLowerCase()));
}
export function radarPoints(tool, cx = 400, cy = 310, radius = 226) {
  if (!isScored(tool)) return null;
  return METRICS.map(([key], i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    return [cx + Math.cos(angle) * radius * tool[key] / 10, cy + Math.sin(angle) * radius * tool[key] / 10];
  });
}
