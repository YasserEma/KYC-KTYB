"use client"
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type CheckboxDropdownProps = {
    label: string;
    options: string[];
    selectedOptions: string[];
    onChange: (selected: string[]) => void;
};

export const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({ label, options, selectedOptions, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleCheckboxChange = (option: string) => {
        const newSelection = selectedOptions.includes(option)
            ? selectedOptions.filter((item) => item !== option)
            : [...selectedOptions, option];
        onChange(newSelection);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="px-3 py-2 border rounded-lg flex items-center gap-2 bg-white w-full sm:w-auto justify-between"
            >
                {label} {selectedOptions.length > 0 && `(${selectedOptions.length})`}
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                    <ul className="py-1 max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <li key={option} className="px-3 py-2 hover:bg-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedOptions.includes(option)}
                                        onChange={() => handleCheckboxChange(option)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};