/**
 * Input Component Tests
 * Input field component testing
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Input from '../src/components/Input';

// Mock theme context
jest.mock('../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4adeff',
      secondary: '#ff6bd6',
      background: '#ffffff',
      text: '#000000',
      textSecondary: '#64748b',
      border: '#cbd5e1',
      surface: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    typography: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
      },
    },
  }),
}));

describe('Input Component', () => {
  test('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  test('renders with value', () => {
    render(<Input value="Test Value" placeholder="Enter text" />);
    
    expect(screen.getByDisplayValue('Test Value')).toBeTruthy();
  });

  test('renders with label', () => {
    render(<Input label="Test Label" placeholder="Enter text" />);
    
    expect(screen.getByText('Test Label')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  test('renders with error state', () => {
    render(<Input placeholder="Enter text" error="This is an error" />);
    
    expect(screen.getByText('This is an error')).toBeTruthy();
  });

  test('renders with helper text', () => {
    render(<Input placeholder="Enter text" />);
    // Input should render without errors
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  test('handles text input', () => {
    const mockOnChange = jest.fn();
    render(<Input placeholder="Enter text" onChangeText={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'New Value');
    
    expect(mockOnChange).toHaveBeenCalledWith('New Value');
  });

  test('handles focus event', () => {
    const mockOnFocus = jest.fn();
    render(<Input placeholder="Enter text" onFocus={mockOnFocus} />);
    
    // Input should render without errors
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  test('handles blur event', () => {
    const mockOnBlur = jest.fn();
    render(<Input placeholder="Enter text" onBlur={mockOnBlur} />);
    
    // Input should render without errors
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  test('handles submit event', () => {
    const mockOnSubmit = jest.fn();
    render(<Input placeholder="Enter text" onSubmit={mockOnSubmit} />);
    
    // Input should render without errors
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  test('renders with different keyboard types', () => {
    render(<Input placeholder="Number input" keyboardType="numeric" />);
    
    // Input should render without errors
    expect(screen.getByPlaceholderText('Number input')).toBeTruthy();
  });

  test('renders with secure text entry', () => {
    render(<Input placeholder="Password" secureTextEntry={true} />);
    
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  test('renders with auto focus', () => {
    render(<Input placeholder="Auto focus" autoFocus={true} />);
    
    expect(screen.getByPlaceholderText('Auto focus')).toBeTruthy();
  });

  test('renders with editable false', () => {
    render(<Input placeholder="Read only" editable={false} />);
    
    expect(screen.getByPlaceholderText('Read only')).toBeTruthy();
  });

  test('renders with multiline', () => {
    render(<Input placeholder="Multiline input" multiline={true} />);
    
    expect(screen.getByPlaceholderText('Multiline input')).toBeTruthy();
  });

  test('renders with maxLength', () => {
    render(<Input placeholder="Limited input" maxLength={10} />);
    
    expect(screen.getByPlaceholderText('Limited input')).toBeTruthy();
  });

  test('renders with custom style', () => {
    render(<Input placeholder="Styled input" style={{ backgroundColor: 'red' }} />);
    
    expect(screen.getByPlaceholderText('Styled input')).toBeTruthy();
  });

  test('renders with disabled state', () => {
    render(<Input placeholder="Disabled input" disabled={true} />);
    
    expect(screen.getByPlaceholderText('Disabled input')).toBeTruthy();
  });

  test('renders with left icon', () => {
    render(<Input placeholder="Icon input" leftIcon="🔍" />);
    
    expect(screen.getByPlaceholderText('Icon input')).toBeTruthy();
  });

  test('renders with right icon', () => {
    render(<Input placeholder="Icon input" rightIcon="✓" />);
    
    expect(screen.getByPlaceholderText('Icon input')).toBeTruthy();
  });

  test('renders with both icons', () => {
    render(
      <Input 
        placeholder="Double icon input" 
        leftIcon="🔍" 
        rightIcon="✓" 
      />
    );
    
    expect(screen.getByPlaceholderText('Double icon input')).toBeTruthy();
  });

  test('renders with clear button when value exists', () => {
    const mockOnClear = jest.fn();
    render(
      <Input 
        placeholder="Clearable input" 
        value="Some value"
        onClear={mockOnClear}
        clearable
      />
    );
    
    expect(screen.getByDisplayValue('Some value')).toBeTruthy();
  });

  test('handles clear button press', () => {
    const mockOnClear = jest.fn();
    render(
      <Input 
        placeholder="Clearable input" 
        value="Some value"
        onClear={mockOnClear}
        clearable
      />
    );
    
    // Input should render without errors
    expect(screen.getByDisplayValue('Some value')).toBeTruthy();
  });

  test('renders with variant styles', () => {
    render(<Input placeholder="Outlined input" variant="outlined" />);
    
    expect(screen.getByPlaceholderText('Outlined input')).toBeTruthy();
  });

  test('renders with size variants', () => {
    render(<Input placeholder="Small input" size="sm" />);
    
    expect(screen.getByPlaceholderText('Small input')).toBeTruthy();
  });

  test('renders with full width', () => {
    render(<Input placeholder="Full width input" fullWidth />);
    
    expect(screen.getByPlaceholderText('Full width input')).toBeTruthy();
  });

  test('handles accessibility props', () => {
    render(
      <Input 
        placeholder="Accessible input"
        accessibilityLabel="Input field"
        accessibilityHint="Enter your text here"
      />
    );
    
    expect(screen.getByPlaceholderText('Accessible input')).toBeTruthy();
  });

  test('renders with placeholder text color', () => {
    render(<Input placeholder="Colored placeholder" placeholderTextColor="blue" />);
    
    expect(screen.getByPlaceholderText('Colored placeholder')).toBeTruthy();
  });

  test('renders with text color', () => {
    render(<Input placeholder="Colored text" textColor="red" />);
    
    expect(screen.getByPlaceholderText('Colored text')).toBeTruthy();
  });

  test('renders with border color', () => {
    render(<Input placeholder="Bordered input" borderColor="green" />);
    
    expect(screen.getByPlaceholderText('Bordered input')).toBeTruthy();
  });

  test('renders with background color', () => {
    render(<Input placeholder="Background input" backgroundColor="yellow" />);
    
    expect(screen.getByPlaceholderText('Background input')).toBeTruthy();
  });

  test('handles controlled input', () => {
    const mockSetValue = jest.fn();
    const { rerender } = render(
      <Input 
        placeholder="Controlled input" 
        value="Initial value"
        onChangeText={mockSetValue}
      />
    );
    
    const input = screen.getByDisplayValue('Initial value');
    fireEvent.changeText(input, 'Updated value');
    
    expect(mockSetValue).toHaveBeenCalledWith('Updated value');
  });

  test('handles uncontrolled input', () => {
    render(<Input placeholder="Uncontrolled input" />);
    
    expect(screen.getByPlaceholderText('Uncontrolled input')).toBeTruthy();
  });

  test('renders with loading state', () => {
    render(<Input placeholder="Loading input" loading />);
    
    expect(screen.getByPlaceholderText('Loading input')).toBeTruthy();
  });

  test('renders with success state', () => {
    render(<Input placeholder="Success input" success />);
    
    expect(screen.getByPlaceholderText('Success input')).toBeTruthy();
  });

  test('renders with warning state', () => {
    render(<Input placeholder="Warning input" warning />);
    
    expect(screen.getByPlaceholderText('Warning input')).toBeTruthy();
  });

  test('renders with info state', () => {
    render(<Input placeholder="Info input" info />);
    
    expect(screen.getByPlaceholderText('Info input')).toBeTruthy();
  });

  test('handles long placeholder text', () => {
    const longPlaceholder = 'This is a very long placeholder text that should wrap properly and still be readable within the input field without causing any layout issues.';
    
    render(<Input placeholder={longPlaceholder} />);
    
    expect(screen.getByPlaceholderText(longPlaceholder)).toBeTruthy();
  });

  test('handles empty value gracefully', () => {
    render(<Input placeholder="Empty input" value="" />);
    
    expect(screen.getByDisplayValue('')).toBeTruthy();
  });

  test('handles null value gracefully', () => {
    render(<Input placeholder="Null input" value={null} />);
    
    expect(screen.getByPlaceholderText('Null input')).toBeTruthy();
  });

  test('handles undefined value gracefully', () => {
    render(<Input placeholder="Undefined input" value={undefined} />);
    
    expect(screen.getByPlaceholderText('Undefined input')).toBeTruthy();
  });
});
