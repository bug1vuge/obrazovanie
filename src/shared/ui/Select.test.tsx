import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';
import { Select } from './Select';

const OPTIONS = [
  { value: 'a', label: 'Алгебра' },
  { value: 'b', label: 'Биология' },
  { value: 'c', label: 'Химия' },
] as const;

function Harness({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState<string>('a');
  return (
    <Select
      aria-label="Предмет"
      value={value}
      options={OPTIONS}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('Select', () => {
  it('opens a listbox and selects with the mouse', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('combobox', { name: 'Предмет' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Алгебра' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('option', { name: 'Химия' }));
    expect(trigger).toHaveTextContent('Химия');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('supports keyboard navigation and type-ahead', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('b');
    await user.keyboard('{ArrowDown}{End}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('c');
    await user.keyboard('а');
    expect(onChange).toHaveBeenLastCalledWith('a');
  });

  it('closes on outside click without changing the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Escape closes only the list, not the surrounding dialog', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Диалог">
        <Harness />
      </Modal>,
    );
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
