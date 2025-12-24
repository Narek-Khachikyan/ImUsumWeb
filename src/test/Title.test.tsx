import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Title } from '../components/ui';

describe('Title Component', () => {
   it('renders the title text correctly', () => {
      render(<Title text="Test Title" />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Title');
   });

   it('applies correct CSS classes', () => {
      render(<Title text="Styled Title" />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-blue-600', 'text-5xl', 'font-semibold');
   });
});
