interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * HTML entities MCP.
 *
 * Keyless, offline: encode text to HTML entities and decode HTML entities back
 * to text (named + numeric decimal/hex). Pure functions — no API, no key.
 */


const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', deg: '°', plusmn: '±', times: '×', divide: '÷', frac12: '½', frac14: '¼', frac34: '¾',
  cent: '¢', pound: '£', euro: '€', yen: '¥', sect: '§', para: '¶', middot: '·', bull: '•', dagger: '†',
  Dagger: '‡', permil: '‰', micro: 'µ', eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à', acirc: 'â',
  ccedil: 'ç', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä', szlig: 'ß', aring: 'å', oslash: 'ø',
  Aacute: 'Á', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', pi: 'π', sigma: 'σ', omega: 'ω', infin: '∞',
  ne: '≠', le: '≤', ge: '≥', larr: '←', rarr: '→', uarr: '↑', darr: '↓', harr: '↔', spades: '♠', hearts: '♥',
  diams: '♦', clubs: '♣', star: '★', check: '✓', cross: '✗',
};
const REV: Record<string, string> = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' };

const tools: McpToolExport['tools'] = [
  {
    name: 'encode_html',
    description: 'Encode text to HTML entities. mode "basic" (default) escapes only & < > " \'; mode "extended" also converts every non-ASCII character to a numeric entity. Keyless, offline.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text to encode.' },
        mode: { type: 'string', description: '"basic" (default) or "extended".' },
      },
      required: ['text'],
    },
  },
  {
    name: 'decode_html',
    description: 'Decode HTML entities (named like &amp; and numeric like &#169; / &#xA9;) back to plain text. Keyless, offline.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text containing HTML entities.' } }, required: ['text'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const text = str(args, 'text');
  switch (name) {
    case 'encode_html': {
      const extended = args.mode === 'extended';
      let out = '';
      for (const ch of text) {
        if (REV[ch]) out += `&${REV[ch]};`;
        else if (extended && ch.codePointAt(0)! > 127) out += `&#${ch.codePointAt(0)};`;
        else out += ch;
      }
      return { input_length: text.length, mode: extended ? 'extended' : 'basic', encoded: out };
    }
    case 'decode_html': {
      const out = text
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
        .replace(/&([a-z][a-z0-9]*);/gi, (m, nm) => (nm in NAMED ? NAMED[nm] : m));
      return { decoded: out };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function str(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string') throw new Error(`Required argument "${key}" is missing (a string).`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
