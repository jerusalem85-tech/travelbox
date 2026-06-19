import { useState, useMemo } from 'react';

export function useSortableData(data, defaultSort = { key: '', direction: 'asc' }) {
  const [sortConfig, setSortConfig] = useState(defaultSort);

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return data;
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (!isNaN(Date.parse(aVal)) && !isNaN(Date.parse(bVal))) {
        comparison = new Date(aVal) - new Date(bVal);
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'ar');
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [data, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up text-muted ms-1" style={{fontSize:'0.7rem'}}></i>;
    return <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{fontSize:'0.7rem'}}></i>;
  };

  return { sortedData, requestSort, getSortIcon, sortConfig };
}
