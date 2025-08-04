
import React, { useState, useRef, useEffect } from 'react';

type Option = {
    value: string;
    label: string;
};

type MultiSelectProps = {
    label: string;
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
};

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    return (
        <div className="relative" ref={ref}>
            <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-700/80 border border-zinc-600 rounded-md shadow-sm px-3 py-2 text-left text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
                <span className="block truncate">
                    {selected.length === 0
                        ? `انتخاب ${label}...`
                        : `${selected.length} مورد انتخاب شد`}
                </span>
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-zinc-700 shadow-lg rounded-md border border-zinc-600">
                    <div className="p-2">
                        <input
                            type="search"
                            placeholder="جستجو..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-800 text-zinc-200 placeholder-zinc-400 rounded-md px-3 py-1.5 border border-zinc-600 focus:outline-none"
                        />
                    </div>
                    <ul className="max-h-60 overflow-auto scroll-hidden">
                        {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className="px-3 py-2 cursor-pointer hover:bg-sky-500/20"
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(option.value)}
                                        readOnly
                                        className="h-4 w-4 rounded border-zinc-500 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="mr-3 text-zinc-200">{option.label}</span>
                                </div>
                            </li>
                        )) : (
                            <li className="px-3 py-2 text-center text-zinc-500">موردی یافت نشد.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
