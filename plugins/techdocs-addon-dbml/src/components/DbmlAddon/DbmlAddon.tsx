import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShadowRootElements } from '@backstage/plugin-techdocs-react';
import { DbmlDiagram } from './DbmlDiagram';

const ADDON_CLASS = 'techdocs-addon-dbml';

// With the recommended pymdownx.superfences custom fence (see the README) a
// ```dbml fence becomes <pre class="dbml"><code>. Without it, TechDocs'
// default highlighter emits a generic language-text block with no usable
// class, so code.language-dbml only matches non-highlighted setups; content
// sniffing of language-text blocks (see the mermaid addon) is not implemented.
const DBML_SELECTORS = ['pre.dbml > code', 'code.language-dbml'];

const DbmlBlock = ({ codeBlock }: { codeBlock: HTMLElement }) => {
  const [container, setContainer] = useState<Element | null>(null);
  const source = codeBlock.textContent ?? '';

  useEffect(() => {
    const highlightRoot = (codeBlock.closest('.highlight') ??
      codeBlock.closest('pre') ??
      codeBlock) as HTMLElement;
    const sibling = highlightRoot.nextElementSibling;
    let target: Element;
    if (sibling?.classList.contains(ADDON_CLASS)) {
      target = sibling;
    } else {
      target = document.createElement('div');
      target.className = ADDON_CLASS;
      highlightRoot.insertAdjacentElement('afterend', target);
    }
    highlightRoot.style.display = 'none';
    setContainer(target);
  }, [codeBlock]);

  if (!container) {
    return null;
  }
  return createPortal(<DbmlDiagram source={source} />, container);
};

export const DbmlAddon = () => {
  const codeBlocks = useShadowRootElements<HTMLElement>(DBML_SELECTORS);

  return (
    <>
      {codeBlocks.map((codeBlock, index) => (
        <DbmlBlock key={index} codeBlock={codeBlock} />
      ))}
    </>
  );
};
