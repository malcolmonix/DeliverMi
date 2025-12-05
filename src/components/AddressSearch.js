import { useState, useEffect, useRef } from 'react';
import { geocodeAddress } from '../lib/mapbox';

export default function AddressSearch({ 
  value, 
  onChange, 
  placeholder = 'Search for an address...',
  onSelect,
  onFocus
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);
    
    if (searchQuery.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const addresses = await geocodeAddress(searchQuery);
      setResults(addresses);
    } catch (error) {
      console.error('Address search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (address) => {
    setQuery(address.address);
    setIsOpen(false);
    setResults([]);
    if (onSelect) {
      onSelect({
        lat: address.lat,
        lng: address.lng,
        address: address.address
      });
    }
    if (onChange) {
      onChange(address.address);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
          if (onFocus) onFocus();
        }}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg border border-gray-200 focus:border-black focus:outline-none text-sm"
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{result.address}</div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && results.length === 0 && query.length >= 3 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-gray-500">No addresses found</p>
        </div>
      )}
    </div>
  );
}

