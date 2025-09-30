"use client";

import React, { useMemo, useState } from "react";
import { Search, Download, Plus, Building2Icon, User2 } from "lucide-react";
import Papa from "papaparse";
import { Entity } from "./page";
import Drawer from "./EntityDetailsDrawer";
import { CheckboxDropdown } from "./checkbox-dropdown";

type Props = {
    data: Entity[];
};

export const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
        case 'ACTIVE':
            return `${baseClasses} bg-green-100 text-green-800`;
        case 'PENDING':
            return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'INACTIVE':
            return `${baseClasses} bg-gray-100 text-gray-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};

export const getTypeBadge = (type: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    return type === 'INDIVIDUAL'
        ? `${baseClasses} bg-blue-100 text-blue-800`
        : `${baseClasses} bg-purple-100 text-purple-800`;
};
export const EntitiesTable: React.FC<Props> = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("ALL");
    const [selectedRow, setSelectedRow] = useState<Entity>();
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
    const allTypes = useMemo(() => [...new Set(data.map(e => e.type))], [data]);
    const allStatuses = useMemo(() => ['ACTIVE', 'PENDING', 'INACTIVE'], []);
    const allNationalities = useMemo(() => [
        ...new Set(
            data.map(e => e.countries?.name ?? e.incorporation_countries?.name).filter(Boolean) as string[]
        )
    ].sort(), [data]);
    // --- Filtering logic ---
    const filteredData = useMemo(() => {
        return data.filter((entity) => {
            const matchesSearch =
                entity.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entity.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entity.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entity.reference_id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(entity.type);
            // const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(entity.status);
            const entityNationality = entity.countries?.name ?? entity.incorporation_countries?.name;
            const matchesNationality = selectedNationalities.length === 0 || (entityNationality && selectedNationalities.includes(entityNationality));

            return matchesSearch && matchesType && matchesNationality;
        });
    }, [data, searchTerm, selectedTypes, selectedNationalities]);

    // --- CSV Export ---
    const exportToCSV = () => {
        // 1. Prepare the data for CSV export by "flattening" the nested objects.
        const csvData = filteredData.map(entity => {
            // Get the name from either 'countries' or 'incorporation_countries'
            const nationality = entity.countries?.name ?? entity.incorporation_countries?.name ?? "";

            // Get the full name for the entity
            const name = entity.legal_name ?? `${entity.first_name} ${entity.last_name}`;

            // Return a new, flat object suitable for the CSV
            return {
                id: entity.id,
                reference_id: entity.reference_id,
                name: name,
                type: entity.type,
                nationality: nationality, // Use the flattened nationality string
                created_at: new Date(entity.created_at).toLocaleString(),
            };
        });

        // 2. Use the prepared csvData array to create the CSV string.
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "entities.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    console.log(data)
    const rowClicked = (selectedEntity: Entity) => {
        setShowDrawer(true)
        setSelectedRow(selectedEntity)

    }
    return (
        <> <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search name or ID..."
                        className="px-3 py-2 border rounded-lg w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                        onClick={() => setSearchTerm(searchTerm)}
                    >
                        <Search size={16} /> Search
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <CheckboxDropdown label="Type" options={allTypes} selectedOptions={selectedTypes} onChange={setSelectedTypes} />
                    <CheckboxDropdown label="Status" options={allStatuses} selectedOptions={selectedStatuses} onChange={setSelectedStatuses} />
                    <CheckboxDropdown label="Nationality" options={allNationalities} selectedOptions={selectedNationalities} onChange={setSelectedNationalities} />

                    <button onClick={exportToCSV} className="px-3 py-2 border rounded-lg flex items-center justify-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2">
                        <Plus size={16} /> Create New
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Government ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>

                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center py-4 text-gray-500 italic"
                                >
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((entity, idx) => (
                                <tr key={entity.id} onClick={() => rowClicked(entity)} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.reference_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {entity.legal_name ? <div className="flex gap-3"><Building2Icon />{entity.legal_name} </div> : <div className="flex gap-3"><User2 />{entity.first_name}{entity.last_name}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={getStatusBadge("ACTIVE")}>Active</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={getTypeBadge(entity.type)}>{entity.type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.countries?.name ?? entity.incorporation_countries?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.id.slice(0, 18)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(entity.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
                <button
                    onClick={() => exportToCSV([selectedRow])}
                    className="px-3 py-2 border rounded-lg flex items-center gap-2"
                >
                    <Download size={16} /> Export
                    CSV
                </button>
                Showing {filteredData.length} of {data.length} results
            </p>

        </div>

            {showDrawer && <Drawer handelDownload={() => exportToCSV([selectedRow])} data={selectedRow ?? undefined} closeDrawer={() => setShowDrawer(false)} />
            }</>);
};
