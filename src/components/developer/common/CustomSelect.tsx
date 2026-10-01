import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[] | string[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  themeMode?: 'light' | 'dark';
  size?: 'sm' | 'md';
  id?: string;
  'aria-label'?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  disabled = false,
  themeMode,
  size = 'md',
  id,
  'aria-label': ariaLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find(o => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const SelectedIcon = selectedOption?.icon;

  const isSmall = size === 'sm';

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block w-full text-left font-sans select-none ${isOpen ? 'z-[100]' : 'z-20'} ${className}`}
      id={id}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border transition-all cursor-pointer text-left ${
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs font-medium'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'
        } bg-white dark:bg-[#121624] border-zinc-200 dark:border-[#273951] text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs ${
          isOpen ? 'ring-2 ring-[#533afd]/20 border-[#533afd] dark:border-[#818cf8]' : ''
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {SelectedIcon && (
            <SelectedIcon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown 
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#533afd] dark:text-[#818cf8]' : ''
          }`} 
        />
      </button>

      {/* Floating In-App Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-[100] mt-1 max-h-60 overflow-y-auto rounded-xl border p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100 bg-white dark:bg-[#0d1326] border-zinc-200 dark:border-[#273951] ${dropdownClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-zinc-400 text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map(option => {
              const isSelected = option.value === value;
              const OptionIcon = option.icon;

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {OptionIcon && (
                      <OptionIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#533afd] dark:text-[#818cf8]' : 'text-zinc-400'}`} />
                    )}
                    <div className="truncate">
                      <div className="truncate font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
