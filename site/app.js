import { METRICS, parseMatrix, isScored, filterTools, radarPoints } from './data.js';

const byId = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
const swatches = [
  ['#c26b24', ''], ['#9b7900', '7 5'], ['#487835', '2 5'],
  ['#426aa3', ''], ['#956196', '8 3 2 3'], ['#257a80', '4 4'],
];
const svgElement = (tag, attrs = {}, text = '') => {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.textContent = text;
  return node;
};
const point = (radius, i) => [400 + Math.cos(-Math.PI / 2 + i * Math.PI / 3) * radius,
  310 + Math.sin(-Math.PI / 2 + i * Math.PI / 3) * radius];

async function start() {
  const response = await fetch('data/tool-matrix.csv');
  if (!response.ok) throw new Error(`CSV request failed (${response.status})`);
  const tools = parseMatrix(await response.text());
  const params = new URLSearchParams(location.search);
  const requested = params.getAll('tool');
  const selected = new Set(params.has('selection') ? requested : tools.map(tool => tool.tool));
  const category = byId('category'), search = byId('search');
  for (const name of new Set(tools.map(tool => tool.category))) category.add(new Option(name, name));
  category.value = params.get('category') || '';
  if (category.selectedIndex === -1) category.value = '';
  search.value = params.get('q') || '';
  const list = byId('tool-list'); list.replaceChildren();
  const labels = new Map();
  tools.forEach(tool => {
    const label = document.createElement('label'); label.className = 'tool-option';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = tool.tool;
    checkbox.checked = selected.has(tool.tool);
    const name = document.createElement('span'); name.textContent = tool.tool;
    const detail = document.createElement('small'); detail.textContent = isScored(tool) ? 'Slide scores available' : 'Awaiting scores';
    name.append(detail); label.append(checkbox, name); list.append(label); labels.set(tool.tool, label);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selected.add(tool.tool); else selected.delete(tool.tool);
      render();
    });
  });

  function render() {
    const matching = filterTools(tools, new Set(tools.map(t => t.tool)), category.value, search.value);
    const visible = filterTools(tools, selected, category.value, search.value);
    const scored = visible.filter(isScored);
    const visibleNames = new Set(matching.map(t => t.tool));
    for (const [name, label] of labels) {
      label.hidden = !visibleNames.has(name);
      label.querySelector('input').checked = selected.has(name);
    }
    const query = new URLSearchParams(); query.set('selection', 'custom');
    for (const tool of tools) if (selected.has(tool.tool)) query.append('tool', tool.tool);
    if (category.value) query.set('category', category.value);
    if (search.value) query.set('q', search.value);
    history.replaceState(null, '', `${location.pathname}?${query}${location.hash}`);
    byId('status').textContent = `${visible.length} selected · ${scored.length} plotted · ${visible.length - scored.length} awaiting complete scores`;
    byId('empty').hidden = scored.length > 0;
    if (!visible.length) byId('empty').textContent = 'No tools selected for these filters. Select a tool, choose Select all, or adjust your search.';
    else byId('empty').textContent = 'These tools await complete scores. Their demo references are listed below; no missing value is plotted as zero.';
    drawChart(scored);
    drawTable(visible);
  }

  function drawChart(scored) {
    const chart = byId('radar'); chart.replaceChildren();
    chart.append(svgElement('title', {id:'radar-title'}, 'SM index tool comparison'),
      svgElement('desc', {id:'radar-description'}, `Scores from zero to ten. Plotted tools: ${scored.map(t => t.tool).join(', ') || 'none'}. Exact values follow in the table.`));
    for (let value = 1; value <= 10; value++) {
      const points = METRICS.map((_, i) => point(226 * value / 10, i).join(',')).join(' ');
      chart.append(svgElement('polygon', {points, class:'grid-ring'}));
      if (value % 2 === 0) chart.append(svgElement('text', {x:389, y:314 - 226 * value / 10, 'text-anchor':'end', class:'scale-label'}, String(value)));
    }
    chart.append(svgElement('text', {x:389,y:314,'text-anchor':'end',class:'scale-label'}, '0'));
    METRICS.forEach(([, label], i) => {
      const [x,y] = point(226, i), [lx,ly] = point(264, i);
      chart.append(svgElement('line', {x1:400,y1:310,x2:x,y2:y,class:'grid-spoke'}));
      chart.append(svgElement('text', {x:lx,y:ly+5,class:'axis-label',
        'text-anchor': i === 0 || i === 3 ? 'middle' : i < 3 ? 'start' : 'end'}, label));
    });
    const legend = byId('legend'); legend.replaceChildren();
    for (const tool of scored) {
      const [color,dash] = swatches[tools.indexOf(tool) % swatches.length];
      const points = radarPoints(tool);
      const polygon = svgElement('polygon', {points:points.map(p => p.join(',')).join(' '),stroke:color,fill:color,'stroke-dasharray':dash,class:'profile','data-tool':tool.tool});
      polygon.append(svgElement('title',{},tool.tool)); chart.append(polygon);
      points.forEach(([x,y], i) => {
        const dot = svgElement('circle',{cx:x,cy:y,r:4,fill:color,stroke:'#fff','stroke-width':1});
        dot.append(svgElement('title',{},`${tool.tool}: ${METRICS[i][1]} ${tool[METRICS[i][0]]}/10`)); chart.append(dot);
      });
      const item = document.createElement('span');
      const sample = svgElement('svg',{'aria-hidden':'true',viewBox:'0 0 30 10'});
      sample.append(svgElement('line',{x1:0,y1:5,x2:30,y2:5,stroke:color,'stroke-width':3,'stroke-dasharray':dash}));
      item.append(sample, document.createTextNode(tool.tool)); legend.append(item);
    }
  }

  function drawTable(visible) {
    const body = byId('values'); body.replaceChildren();
    for (const tool of visible) {
      const row = document.createElement('tr');
      const heading = document.createElement('th'); heading.scope = 'row'; heading.textContent = tool.tool;
      const categoryLabel = document.createElement('small'); categoryLabel.textContent = tool.category; heading.append(categoryLabel); row.append(heading);
      for (const [key] of METRICS) {
        const cell = document.createElement('td'); cell.textContent = tool[key] ?? '—';
        if (tool[key] === null) {cell.className = 'missing'; cell.setAttribute('aria-label','Not scored');}
        row.append(cell);
      }
      const evidence = document.createElement('td');
      const paths = tool.evidence.split(';');
      paths.forEach((path, i) => {
        if (i) evidence.append(document.createTextNode(', '));
        const link = document.createElement('a');
        if (path === 'assets/source-chart.png') {link.href = path; link.textContent = 'Source slide';}
        else {
          const [repo,...rest] = path.split('/');
          link.href = `https://github.com/Infra-as-code-ICA0024-TalTech/${encodeURIComponent(repo)}/blob/main/${rest.map(encodeURIComponent).join('/')}`;
          link.textContent = paths.filter(p => p.startsWith(repo+'/')).length > 1 ? `${repo}/${rest.at(-1)}` : repo;
        }
        evidence.append(link);
      });
      const note = document.createElement('small'); note.textContent = tool.notes; evidence.append(note); row.append(evidence); body.append(row);
    }
    if (!visible.length) {
      const row = body.insertRow(), cell = row.insertCell(); cell.colSpan = 8; cell.textContent = 'No tools match your current selection.';
    }
  }
  search.addEventListener('input',render); category.addEventListener('change',render);
  byId('select-all').addEventListener('click',()=>{
    filterTools(tools,new Set(tools.map(t=>t.tool)),category.value,search.value).forEach(t=>selected.add(t.tool)); render();
  });
  byId('clear').addEventListener('click',()=>{selected.clear();render();});
  render();
}

start().catch(error => {
  byId('error').hidden = false;
  byId('error').textContent = `Could not load the matrix: ${error.message}. Reload the page or download the CSV. For local use, start the server described in the README.`;
  byId('status').textContent = 'Comparison unavailable';
  byId('tool-list').textContent = 'Tool data could not be loaded.';
});
