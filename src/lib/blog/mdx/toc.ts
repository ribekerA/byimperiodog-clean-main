import type { Parent } from 'unist';

export interface TocItem {
  id: string;
  depth: number;
  value: string;
  children: TocItem[];
}

function slugify(value: string){
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-À-ÖØ-öø-ÿ]/g,'')
    .trim()
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-');
}

export function buildToc(root: Parent): TocItem[] {
  const headings: TocItem[] = [];
  const stack: TocItem[] = [];
  (root.children||[]).forEach((node:any) => {
    if(node.type === 'element' && /^h[1-4]$/.test(node.tagName)) {
      const depth = parseInt(node.tagName.substring(1), 10);
      const text = extractText(node) || '';
      const id = (node.properties && node.properties.id) ? String(node.properties.id) : slugify(text);
      const item: TocItem = { id, depth, value: text, children: [] };
      while (stack.length && stack[stack.length-1].depth >= depth) stack.pop();
      if(!stack.length) headings.push(item); else stack[stack.length-1].children.push(item);
      stack.push(item);
    }
  });
  return headings;
}

function extractText(node:any):string {
  if(!node) return '';
  if(node.type === 'text') return node.value || '';
  if(Array.isArray(node.children)) return node.children.map(extractText).join('');
  return '';
}
