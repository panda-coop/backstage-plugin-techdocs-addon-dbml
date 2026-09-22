import { act, fireEvent, render, screen } from '@testing-library/react';
import { NodeTooltip } from './NodeTooltip';

describe('NodeTooltip', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows the content after the enter delay and hides on leave', () => {
    render(
      <NodeTooltip content="a note">
        <span>row</span>
      </NodeTooltip>,
    );
    const wrapper = screen.getByText('row').parentElement!;

    fireEvent.mouseEnter(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(300));
    expect(screen.getByRole('tooltip')).toHaveTextContent('a note');

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not open when leaving before the delay elapses', () => {
    render(
      <NodeTooltip content="a note">
        <span>row</span>
      </NodeTooltip>,
    );
    const wrapper = screen.getByText('row').parentElement!;

    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders children without tooltip machinery when there is no content', () => {
    render(
      <NodeTooltip>
        <span>row</span>
      </NodeTooltip>,
    );
    const wrapper = screen.getByText('row').parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
