import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@material-ui/core';
import { Parser } from '@dbml/core';
import { DbmlDiagram } from './DbmlDiagram';

const SOURCE = 'Table users {\n  id integer [primary key]\n}';

// Ensure the source parses before rendering the component.
Parser.parse(SOURCE, 'dbmlv2');

describe('DbmlDiagram theming', () => {
  it('uses the MUI light defaults without a provider', () => {
    const { getByTestId } = render(<DbmlDiagram source={SOURCE} />);
    // MUI light background.paper
    expect(getByTestId('dbml-diagram').style.background).toBe(
      'rgb(255, 255, 255)',
    );
  });

  it('follows a dark MUI theme', () => {
    const { getByTestId } = render(
      <ThemeProvider theme={createTheme({ palette: { type: 'dark' } })}>
        <DbmlDiagram source={SOURCE} />
      </ThemeProvider>,
    );
    const frame = getByTestId('dbml-diagram');
    // MUI dark background.paper #424242 and text.primary #fff
    expect(frame.style.background).toBe('rgb(66, 66, 66)');
    expect(frame.style.color).toBe('rgb(255, 255, 255)');
  });

  it('follows custom theme colors', () => {
    const { getByTestId } = render(
      <ThemeProvider
        theme={createTheme({
          palette: { background: { paper: '#123456' } },
        })}
      >
        <DbmlDiagram source={SOURCE} />
      </ThemeProvider>,
    );
    expect(getByTestId('dbml-diagram').style.background).toBe(
      'rgb(18, 52, 86)',
    );
  });
});
