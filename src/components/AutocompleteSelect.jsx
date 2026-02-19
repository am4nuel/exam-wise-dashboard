import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Loader } from 'lucide-react';
import './AutocompleteSelect.css';

const AutocompleteSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Type to search...',
  required = false,
  disabled = false,
  loading = false,
  onSearch,
  displayKey = 'name',
  valueKey = 'id',
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const lastSearchedTerm = useRef(null); // Ref to track last term searched

  // Get display text for selected value
  const selectedOption = options.find(opt => opt[valueKey] === value);
  const displayText = selectedOption ? selectedOption[displayKey] : '';

  // Filter options based on search term (only if we have local options)
  const filteredOptions = options.filter(option =>
    option[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle search with debounce
  useEffect(() => {
    if (!onSearch) return;
    
    // Don't search if the term hasn't changed since last search
    if (searchTerm === lastSearchedTerm.current) return;

    const timer = setTimeout(() => {
      onSearch(searchTerm);
      lastSearchedTerm.current = searchTerm;
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true); // Always open on change
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      // Trigger initial search if empty to show all options initially
      if (searchTerm === '' && onSearch) {
        onSearch('');
        lastSearchedTerm.current = '';
      }
    }
  };

  // Highlight matching text
  const highlightMatch = (text, search) => {
    if (!search) return text;
    
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === search.toLowerCase() 
        ? <mark key={index}>{part}</mark> 
        : part
    );
  };

  return (
    <div className={`autocomplete-select ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`} ref={containerRef}>
      {label && (
        <label className="autocomplete-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      
      <div className="autocomplete-input-wrapper">
        <div className="autocomplete-input-container" onClick={() => !disabled && inputRef.current?.focus()}>
          <Search size={16} className="search-icon" />
          
          <input
            ref={inputRef}
            type="text"
            className="autocomplete-input"
            placeholder={displayText || placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoComplete="off"
          />
          
          <div className="autocomplete-actions">
            {loading && <Loader size={16} className="loading-spinner" />}
            {value && !loading && (
              <button
                type="button"
                className="clear-btn"
                onClick={handleClear}
                tabIndex={-1}
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown 
              size={16} 
              className={`dropdown-icon ${isOpen ? 'open' : ''}`}
            />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="autocomplete-dropdown" ref={dropdownRef}>
            {loading ? (
              <div className="autocomplete-loading">
                <Loader size={20} className="loading-spinner" />
                <span>Loading options...</span>
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option[valueKey]}
                  className={`autocomplete-option ${highlightedIndex === index ? 'highlighted' : ''} ${value === option[valueKey] ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {highlightMatch(option[displayKey], searchTerm)}
                </div>
              ))
            ) : (
              <div className="autocomplete-empty">
                No results found
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="autocomplete-error">{error}</div>}
    </div>
  );
};

export default AutocompleteSelect;
