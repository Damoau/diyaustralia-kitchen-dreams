import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { expect, test, describe, vi } from 'vitest';

describe('Button Component', () => {
  test('renders button with text', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    
    expect(getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('applies variant classes correctly', () => {
    const { getByRole } = render(<Button variant="destructive">Delete</Button>);
    
    const button = getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  test('handles click events', async () => {
    const user = await import('@testing-library/user-event').then(m => m.default.setup());
    const handleClick = vi.fn();
    
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    
    const button = getByRole('button');
    expect(button).toBeDisabled();
  });

  test('renders with different sizes', () => {
    const { getByRole, rerender } = render(<Button size="sm">Small</Button>);
    
    let button = getByRole('button');
    expect(button).toHaveClass('h-8');
    
    rerender(<Button size="lg">Large</Button>);
    
    button = getByRole('button');
    expect(button).toHaveClass('h-10');
  });
});