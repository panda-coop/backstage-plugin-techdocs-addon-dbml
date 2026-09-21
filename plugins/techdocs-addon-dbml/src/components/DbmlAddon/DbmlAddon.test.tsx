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
  it('replaces custom-fence dbml blocks with the placeholder diagram', async () => {
    // Markup produced by the recommended pymdownx.superfences custom fence.
    const { shadowRoot } = await renderDom(
      <body>
        <pre className="dbml">
          <code>{DBML_FIXTURE}</code>
        </pre>
      </body>,
    );

    const diagram = shadowRoot!.querySelector('[data-testid="dbml-diagram"]');
    expect(diagram).not.toBeNull();
    expect(diagram!.textContent).toContain('users');
    expect(diagram!.textContent).toContain('posts');
    expect(diagram!.textContent).toContain('1 relationship(s)');

    const original = shadowRoot!.querySelector<HTMLElement>('pre.dbml');
    expect(original!.style.display).toBe('none');
  });

  it('replaces language-dbml code blocks with the placeholder diagram', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="highlight">
          <pre>
            <code className="language-dbml">{DBML_FIXTURE}</code>
          </pre>
        </div>
      </body>,
    );

    expect(
      shadowRoot!.querySelector('[data-testid="dbml-diagram"]'),
    ).not.toBeNull();
    const original = shadowRoot!.querySelector<HTMLElement>('.highlight');
    expect(original!.style.display).toBe('none');
  });

  it('shows a parse error for invalid dbml', async () => {
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

  it('leaves non-dbml code blocks alone', async () => {
    const { shadowRoot } = await renderDom(
      <body>
        <div className="highlight">
          <pre>
            <code className="language-sql">SELECT 1;</code>
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
});
