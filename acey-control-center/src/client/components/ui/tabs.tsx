import React, { useState } from 'react';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  isActive?: boolean;
  className?: string;
}

export const TabsContext = React.createContext<{
  activeValue: string;
  setActiveValue: (value: string) => void;
}>({
  activeValue: '',
  setActiveValue: () => {}
});

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue, className = '' }) => {
  const [activeValue, setActiveValue] = useState(defaultValue || '');

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex space-x-1 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  children, 
  value, 
  isActive,
  onClick,
  className = ''
}) => {
  const { activeValue, setActiveValue } = React.useContext(TabsContext);
  const isCurrentlyActive = isActive !== undefined ? isActive : activeValue === value;

  const handleClick = () => {
    setActiveValue(value);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
        isCurrentlyActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ 
  children, 
  value, 
  isActive,
  className = ''
}) => {
  const { activeValue } = React.useContext(TabsContext);
  const isCurrentlyActive = isActive !== undefined ? isActive : activeValue === value;

  if (!isCurrentlyActive) {
    return null;
  }

  return (
    <div className={`py-4 ${className}`}>
      {children}
    </div>
  );
};
