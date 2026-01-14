import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onTab?: (direction: 'next' | 'previous') => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onArrow?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onSpace?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onTab,
  onEnter,
  onEscape,
  onArrow,
  onSpace,
  enabled = true,
}: KeyboardNavigationOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        onTab?.(event.shiftKey ? 'previous' : 'next');
        break;
      case 'Enter':
        event.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrow?.('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrow?.('down');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onArrow?.('left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        onArrow?.('right');
        break;
      case ' ':
        event.preventDefault();
        onSpace?.();
        break;
    }
  }, [enabled, onTab, onEnter, onEscape, onArrow, onSpace]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

interface FocusTrapOptions {
  enabled?: boolean;
  onEscape?: () => void;
}

export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, options: FocusTrapOptions = {}) {
  const { enabled = true, onEscape } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Focus first element when trap is activated
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [enabled, containerRef, onEscape]);
}
