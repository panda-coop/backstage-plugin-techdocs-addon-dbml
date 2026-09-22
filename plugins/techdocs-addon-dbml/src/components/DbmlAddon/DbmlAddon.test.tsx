import { fireEvent } from '@testing-library/react';
import { TechDocsAddonTester } from '@backstage/plugin-techdocs-addons-test-utils';
import { Dbml } from '../../plugin';

const DBML_FIXTURE = `
Table users {
  id integer [primary key]
  username varchar
}

Table posts {
  id integer [primary key]
  user_id integer
}

Ref: posts.user_id > users.id
`;

const renderDom = async (dom: React.JSX.Element) =>
  TechDocsAddonTester.buildAddonsInTechDocs([<Dbml />])
    .withDom(dom)
    .renderWithEffects();

describe('Dbml addon', () => {
  it('claims sniffed techdocs text blocks that parse as dbml', async () => {
    // TechDocs has no dbml lexer: the fence is emitted as a language-text
    // highlight block with no class on the code element.
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-text highlight">
          <pre>
            <code>{DBML_FIXTURE}</code>
          </pre>
        </div>
      </body>,
    );

    const diagram = shadowRoot!.querySelector('[data-testid="dbml-diagram"]');
    expect(diagram).not.toBeNull();
    expect(diagram!.textContent).toContain('2 tables · 1 relationship');
    expect(diagram!.querySelector('.react-flow')).not.toBeNull();
    expect(diagram!.textContent).toContain('users');
    expect(diagram!.textContent).toContain('posts');

    const original = shadowRoot!.querySelector<HTMLElement>('.highlight');
    expect(original!.style.display).toBe('none');
  });

  it('switches between diagram and code view', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-text highlight">
          <pre>
            <code>{DBML_FIXTURE}</code>
          </pre>
        </div>
      </body>,
    );

    const diagram = shadowRoot!.querySelector('[data-testid="dbml-diagram"]')!;
    const codeButton = diagram.querySelector<HTMLButtonElement>(
      'button[aria-label="Code view"]',
    )!;
    fireEvent.click(codeButton);
    expect(diagram.querySelector('[data-testid="dbml-source"]')).not.toBeNull();
    expect(diagram.querySelector('.react-flow')).toBeNull();

    const diagramButton = diagram.querySelector<HTMLButtonElement>(
      'button[aria-label="Diagram view"]',
    )!;
    fireEvent.click(diagramButton);
    expect(diagram.querySelector('.react-flow')).not.toBeNull();
  });

  it('collapses a table to its header via the chevron', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-text highlight">
          <pre>
            <code>{DBML_FIXTURE}</code>
          </pre>
        </div>
      </body>,
    );

    const diagram = shadowRoot!.querySelector('[data-testid="dbml-diagram"]')!;
    expect(diagram.textContent).toContain('username');

    const chevrons = diagram.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Collapse table"]',
    );
    expect(chevrons.length).toBe(2);
    // The users table renders first; collapsing it hides its rows.
    fireEvent.click(chevrons[0]);
    expect(diagram.textContent).not.toContain('username');
    expect(diagram.textContent).toContain('users');
    // Footer summary is untouched.
    expect(diagram.textContent).toContain('2 tables · 1 relationship');

    fireEvent.click(
      diagram.querySelector<HTMLButtonElement>(
        'button[aria-label="Expand table"]',
      )!,
    );
    expect(diagram.textContent).toContain('username');
  });

  it('opens and closes the expanded diagram dialog', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-text highlight">
          <pre>
            <code>{DBML_FIXTURE}</code>
          </pre>
        </div>
      </body>,
    );

    const expand = shadowRoot!.querySelector<HTMLButtonElement>(
      'button[aria-label="Expand diagram"]',
    );
    expect(expand).not.toBeNull();

    fireEvent.click(expand!);
    const dialog = document.body.querySelector('[data-testid="dbml-dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.querySelector('.react-flow')).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      document.body.querySelector('[data-testid="dbml-dialog"]'),
    ).toBeNull();
  });

  it('shares the diagram/code view between the inline block and the dialog', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-text highlight">
          <pre>
            <code>{DBML_FIXTURE}</code>
          </pre>
        </div>
      </body>,
    );

    const diagram = shadowRoot!.querySelector('[data-testid="dbml-diagram"]')!;
    fireEvent.click(
      diagram.querySelector<HTMLButtonElement>(
        'button[aria-label="Code view"]',
      )!,
    );

    // The dialog opens in the view active inline.
    fireEvent.click(
      shadowRoot!.querySelector<HTMLButtonElement>(
        'button[aria-label="Expand diagram"]',
      )!,
    );
    const dialog = document.body.querySelector('[data-testid="dbml-dialog"]')!;
    expect(
      dialog.querySelector('[data-testid="dbml-dialog-source"]'),
    ).not.toBeNull();
    expect(dialog.querySelector('.react-flow')).toBeNull();

    // Switching in the dialog switches the inline block too.
    fireEvent.click(
      dialog.querySelector<HTMLButtonElement>(
        'button[aria-label="Diagram view"]',
      )!,
    );
    expect(dialog.querySelector('.react-flow')).not.toBeNull();
    expect(diagram.querySelector('.react-flow')).not.toBeNull();
    expect(diagram.querySelector('[data-testid="dbml-source"]')).toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
  });

  it('strips line numbers from highlighttable blocks', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-text highlight">
          <table className="highlighttable">
            <tbody>
              <tr>
                <td className="linenos">
                  <div className="linenodiv">
                    <pre>1 2 3</pre>
                  </div>
                </td>
                <td className="code">
                  <div>
                    <pre>
                      <code>{'Table users {\n  id integer\n}'}</code>
                    </pre>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>,
    );

    const diagram = shadowRoot!.querySelector('[data-testid="dbml-diagram"]');
    expect(diagram).not.toBeNull();
    expect(diagram!.textContent).toContain('1 table · 0 relationships');
  });

  it('claims explicitly marked dbml blocks', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <pre className="dbml">
          <code>{DBML_FIXTURE}</code>
        </pre>
      </body>,
    );

    expect(
      shadowRoot!.querySelector('[data-testid="dbml-diagram"]'),
    ).not.toBeNull();
    const original = shadowRoot!.querySelector<HTMLElement>('pre.dbml');
    expect(original!.style.display).toBe('none');
  });

  it('shows a parse error for invalid explicit dbml', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="highlight">
          <pre>
            <code className="language-dbml">{'Table { nope'}</code>
          </pre>
        </div>
      </body>,
    );

    expect(
      shadowRoot!.querySelector('[data-testid="dbml-error"]'),
    ).not.toBeNull();
  });

  it('leaves blocks declaring another language alone', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-sql highlight">
          <pre>
            <code>SELECT 1;</code>
          </pre>
        </div>
      </body>,
    );

    expect(
      shadowRoot!.querySelector('[data-testid="dbml-diagram"]'),
    ).toBeNull();
    const original = shadowRoot!.querySelector<HTMLElement>('.highlight');
    expect(original!.style.display).not.toBe('none');
  });

  it('leaves text blocks that do not parse as dbml alone', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="language-text highlight">
          <pre>
            <code>{'Table users {\n  broken [primary key\n'}</code>
          </pre>
        </div>
      </body>,
    );

    expect(
      shadowRoot!.querySelector('[data-testid="dbml-diagram"]'),
    ).toBeNull();
    expect(shadowRoot!.querySelector('[data-testid="dbml-error"]')).toBeNull();
    const original = shadowRoot!.querySelector<HTMLElement>('.highlight');
    expect(original!.style.display).not.toBe('none');
  });
});
