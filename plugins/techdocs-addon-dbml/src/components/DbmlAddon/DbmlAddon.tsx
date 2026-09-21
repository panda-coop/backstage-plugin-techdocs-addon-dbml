import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShadowRootElements } from '@backstage/plugin-techdocs-react';
import { Parser } from '@dbml/core';
import { DbmlDiagram } from './DbmlDiagram';

const ADDON_CLASS = 'techdocs-addon-dbml';

// TechDocs' highlighter has no dbml lexer, so a ```dbml fence is rendered as
// a generic language-text block — the fence language is lost. Like the
// mermaid addon, we collect all highlight blocks, skip ones that declare a
// real language, and content-sniff the undeclared/text remainder by trying
// to parse them as DBML. Explicit dbml classes are kept for setups that
// emit them (plain markdown renderers, custom fences).
const CANDIDATE_SELECTORS = [
  '.highlighttable',
  '.highlight',
  'pre.dbml',
  '.dbml',
  'code.language-dbml',
];

const LINE_NUMBER_SELECTORS = '.linenos, .linenodiv, .lnt';

const languageClassPattern = /(?:^|\s)language-([\w-]+)/;

const declaredLanguage = (element: HTMLElement): string | undefined => {
  const carriers = [element, ...element.querySelectorAll('pre, code')];
  for (const carrier of carriers) {
    const match = languageClassPattern.exec(carrier.className);
    if (match) {
      return match[1];
    }
  }
  return undefined;
};

const getSource = (element: HTMLElement): string => {
  const sourceRoot = element.matches('code')
    ? element
    : element.querySelector('td.code code, code') ?? element;
  const clone = sourceRoot.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone
      .querySelectorAll(LINE_NUMBER_SELECTORS)
      .forEach(node => node.remove());
  }
  return (clone.textContent ?? '').trim();
};

const outermostCandidates = (elements: HTMLElement[]): HTMLElement[] => {
  const unique = [...new Set(elements)];
  return unique.filter(element =>
    unique.every(other => other === element || !other.contains(element)),
  );
};

const parsesAsDbml = (source: string): boolean => {
  try {
    Parser.parse(source, 'dbmlv2');
    return true;
  } catch {
    return false;
  }
};

type ClaimedBlock = {
  container: Element;
  source: string;
};

/**
 * Decides once per candidate element whether to claim it, performs the DOM
 * swap in an effect, and portals the diagram into the inserted container.
 * All state lives per candidate, keyed on the stable DOM element identity —
 * the parent must stay stateless, since useShadowRootElements returns a new
 * array identity on every render and any parent setState would loop.
 */
const DbmlCandidate = ({ candidate }: { candidate: HTMLElement }) => {
  const [block, setBlock] = useState<ClaimedBlock | null>(null);

  useEffect(() => {
    const processed = candidate.dataset.dbmlProcessed === 'true';
    // Skip blocks hidden by something else (e.g. another addon).
    if (candidate.style.display === 'none' && !processed) {
      return;
    }

    const source = getSource(candidate);
    if (!source) {
      return;
    }

    if (processed) {
      // Claimed by a previous mount — reuse the container, never mutate the
      // candidate again.
      const sibling = candidate.nextElementSibling;
      if (sibling?.classList.contains(ADDON_CLASS)) {
        setBlock({ container: sibling, source });
      }
      return;
    }

    const language = declaredLanguage(candidate);
    const explicit =
      language === 'dbml' || candidate.matches('pre.dbml, .dbml');
    if (!explicit) {
      // A block declaring a real language is an ordinary code sample; only
      // undeclared and text blocks are sniffed, and only ones that actually
      // parse are claimed — broken DBML in a text block cannot be told
      // apart from prose, so it is left as a code block.
      if (language && language !== 'text') {
        return;
      }
      if (!parsesAsDbml(source)) {
        return;
      }
    }

    const container = document.createElement('div');
    container.className = ADDON_CLASS;
    candidate.insertAdjacentElement('afterend', container);
    candidate.dataset.dbmlProcessed = 'true';
    candidate.style.display = 'none';
    setBlock({ container, source });
  }, [candidate]);

  if (!block) {
    return null;
  }
  return createPortal(<DbmlDiagram source={block.source} />, block.container);
};

export const DbmlAddon = () => {
  const candidates = useShadowRootElements<HTMLElement>(CANDIDATE_SELECTORS);

  return (
    <>
      {outermostCandidates(candidates).map((candidate, index) => (
        <DbmlCandidate key={index} candidate={candidate} />
      ))}
    </>
  );
};
