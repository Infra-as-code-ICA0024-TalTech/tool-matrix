import { METRICS, parseMatrix, isScored, filterTools, radarPoints } from './data.js';

const byId = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
// XA categorical palette (rose, navy, sky, amber, green, slate, maroon and tints), one colour and
// line pattern per tool in CSV order. The first three keep the slide's orange/ochre/green associations.
const swatches = [
  ['#d97706', ''], ['#9a6a00', '7 5'], ['#16a34a', '2 5'],
  ['#3d496e', ''], ['#d27079', '8 3 2 3'], ['#0879ad', '4 4'],
  ['#800000', '1 4'], ['#535c73', '10 4'], ['#8991a8', '3 3 9 3'],
  ['#a94552', '6 2'], ['#0f6e3a', ''], ['#0ea5e9', '12 3 3 3'],
  ['#6c7aa6', '5 2 1 2'],
];
const svgElement = (tag, attrs = {}, text = '') => {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.textContent = text;
  return node;
};
const lineSample = ([color, dash]) => {
  const sample = svgElement('svg', {'aria-hidden':'true', viewBox:'0 0 30 10', focusable:'false'});
  sample.append(svgElement('line', {x1:0, y1:5, x2:30, y2:5, stroke:color, 'stroke-width':3, 'stroke-dasharray':dash}));
  return sample;
};
const point = (radius, i) => [400 + Math.cos(-Math.PI / 2 + i * Math.PI / 3) * radius,
  310 + Math.sin(-Math.PI / 2 + i * Math.PI / 3) * radius];

async function start() {
  const response = await fetch('data/tool-matrix.csv');
  if (!response.ok) throw new Error(`CSV request failed (${response.status})`);
  const tools = parseMatrix(await response.text()).filter(isScored);
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
    const swatch = lineSample(swatches[tools.indexOf(tool) % swatches.length]);
    swatch.classList.add('swatch');
    label.append(checkbox, name, swatch); list.append(label); labels.set(tool.tool, label);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selected.add(tool.tool); else selected.delete(tool.tool);
      render();
    });
  });

  function render() {
    const matching = filterTools(tools, new Set(tools.map(t => t.tool)), category.value, search.value);
    const visible = filterTools(tools, selected, category.value, search.value);
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
    byId('status').textContent = `${visible.length} of ${tools.length} tools selected`;
    byId('empty').hidden = visible.length > 0;
    drawChart(visible);
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
        const dot = svgElement('circle',{cx:x,cy:y,r:4,fill:color,stroke:'#fff','stroke-width':1.5});
        dot.append(svgElement('title',{},`${tool.tool}: ${METRICS[i][1]} ${tool[METRICS[i][0]]}/10`)); chart.append(dot);
      });
      const item = document.createElement('span');
      item.append(lineSample([color, dash]), document.createTextNode(tool.tool)); legend.append(item);
    }
  }

  function drawTable(visible) {
    const body = byId('values'); body.replaceChildren();
    for (const tool of visible) {
      const row = document.createElement('tr');
      const heading = document.createElement('th'); heading.scope = 'row'; heading.textContent = tool.tool;
      row.append(heading);
      for (const [key] of METRICS) {
        const cell = document.createElement('td'); cell.textContent = tool[key]; row.append(cell);
      }
      body.append(row);
    }
    if (!visible.length) {
      const row = body.insertRow(), cell = row.insertCell(); cell.colSpan = 7; cell.textContent = 'No tools match your current selection.';
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
