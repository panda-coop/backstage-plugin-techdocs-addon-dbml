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
    expect(diagram!.textContent).toContain('2 table(s), 1 relationship(s)');
    expect(diagram!.querySelector('.react-flow')).not.toBeNull();
    expect(diagram!.textContent).toContain('users');
    expect(diagram!.textContent).toContain('posts');

    const original = shadowRoot!.querySelector<HTMLElement>('.highlight');
    expect(original!.style.display).toBe('none');
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

    const expand = [
      ...shadowRoot!.querySelectorAll<HTMLButtonElement>('button'),
    ].find(button => button.textContent === 'Expand');
    expect(expand).toBeDefined();

    fireEvent.click(expand!);
    const dialog = document.body.querySelector('[data-testid="dbml-dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.querySelector('.react-flow')).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      document.body.querySelector('[data-testid="dbml-dialog"]'),
    ).toBeNull();
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
    expect(diagram!.textContent).toContain('1 table(s), 0 relationship(s)');
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
