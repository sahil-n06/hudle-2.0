import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SlotGrid from '@/components/SlotGrid';

const slots = [
  { startTime: '06:00', endTime: '07:00', status: 'available', price: 1500 },
  { startTime: '07:00', endTime: '08:00', status: 'booked', price: 1500 },
];

describe('SlotGrid', () => {
  it('shows availability and disables booked slots', () => {
    render(<SlotGrid slots={slots} selected={null} onSelect={() => {}} />);
    expect(screen.getByText('1 of 2 slots available')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /7:00 AM – 8:00 AM/ }),
    ).toBeDisabled();
  });
  it('selects and deselects a slot', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <SlotGrid slots={slots} selected={null} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /6:00 AM/ }));
    expect(onSelect).toHaveBeenCalledWith(slots[0]);
    rerender(
      <SlotGrid slots={slots} selected={slots[0]} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /6:00 AM/ }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
  it("marks this browser's booking and opens it on click", () => {
    const onOpenMine = vi.fn();
    const onSelect = vi.fn();
    render(
      <SlotGrid
        slots={slots}
        selected={null}
        onSelect={onSelect}
        isMine={(s) => s.startTime === '07:00'}
        onOpenMine={onOpenMine}
      />,
    );
    const mine = screen.getByRole('button', { name: /Your booking/ });
    expect(mine).toBeEnabled();
    fireEvent.click(mine);
    expect(onOpenMine).toHaveBeenCalledWith(slots[1]);
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('shows an empty state', () => {
    render(<SlotGrid slots={[]} onSelect={() => {}} />);
    expect(screen.getByText('No slots on this date')).toBeInTheDocument();
  });
});
