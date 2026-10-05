import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Plus, Save, ArrowLeft, Printer } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { holidays2026 } from '../../utils/holidays2026';

// Fixed Sections Configuration
const FIXED_SECTIONS = {
    'Branch Outside': ['Camera', 'Shutter', 'M.S Main Door', 'Hotter DSC', 'Hotter Fire'],
    'ATM Inside': ['M.S', 'Shutter Removal', 'PIR', 'G.B.D', 'Sesmic', 'Camera', 'Panic', 'S.D', 'M.S Bank to ATM', '2 Way'],
    'Branch Lobby': ['PIR', 'Camera', 'Hotter DSC', 'Hotter Fire', 'Panic', 'S.D', 'R.I', 'Fire Panel', 'Fire Battery', 'MCB', '2 Way'],
    'Vault Room': ['M.S', 'PIR', 'V.D', 'Sesmic', 'Camera'],
    'Gold Loan': ['PIR', 'Camera', 'V.D', 'EM Lock', 'Push Button', 'S.D', 'Panic'],
    'Cash Counter': ['Panic', 'Camera', 'PIR', 'S.D'],
    'BM Cabin': ['S.D', 'Panic'],
    'Server Room': ['Camera', 'M.S Door', 'DSC Panel', 'DSC Battery', 'S.D', 'E.M Lock', 'Keypad', 'Push Button']
};

const SecurityFormEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Auto-focus helper for mobile UX
    const handleQtyInputAndNext = (e, callback) => {
        const val = e.target.value;
        callback(val);
        
        // Auto jump if a single digit is entered (since most quantities are 1-9)
        if (val !== '' && val.length === 1) {
            const inputs = Array.from(document.querySelectorAll('.qty-input'));
            const index = inputs.indexOf(e.target);
            if (index > -1 && index < inputs.length - 1) {
                // small timeout ensures the current render cycle finishes
                setTimeout(() => inputs[index + 1].focus(), 10);
            }
        }
    };
    
    const [equipmentMaster, setEquipmentMaster] = useState([]);
    
    const [formData, setFormData] = useState({
        branch_code: '',
        address: '',
        state: ''
    });

    // State for fixed sections
    const [sections, setSections] = useState({});
    
    // State for dynamic lists
    const [requirements, setRequirements] = useState([]);
    const [installations, setInstallations] = useState([]);
    
    // Dropdown selection states
    const [reqSelectedEq, setReqSelectedEq] = useState('');
    const [reqQty, setReqQty] = useState(0);
    const [instSelectedEq, setInstSelectedEq] = useState('');
    const [instQty, setInstQty] = useState(0);

    // State for fixed sections add dropdowns
    const [fixedAddState, setFixedAddState] = useState({});
    
    // State for section configurations (Merged, Not Available)
    const [sectionConfigs, setSectionConfigs] = useState({});

    // State for custom equipment modal
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customEqName, setCustomEqName] = useState('');
    const [isCreatingCustom, setIsCreatingCustom] = useState(false);

    const fetchEquipmentMaster = async () => {
        try {
            const eqRes = await api.get('/security-equipment');
            let eqList = Array.isArray(eqRes.data) && eqRes.data.length > 0 ? eqRes.data : [];
            
            if (eqList.length === 0) {
                toast.error("Using default equipment list. (Database tables may be missing)");
                const defaultNames = Array.from(new Set([
                    'Camera', 'Shutter', 'M.S Main Door', 'Hotter DSC', 'Hotter Fire', 
                    'M.S', 'Shutter Removal', 'PIR', 'G.B.D', 'Sesmic', 'Panic', 'S.D', 
                    'M.S Bank to ATM', '2 Way', 'R.I', 'Fire Panel', 'Fire Battery', 
                    'MCB', 'V.D', 'EM Lock', 'Push Button', 'Keypad', 'DSC Panel', 
                    'DSC Battery', 'E.M Lock', 'M.S Door'
                ])).sort();
                eqList = defaultNames.map((name, i) => ({ id: i + 1000, name: name }));
            }
            setEquipmentMaster(eqList);
            return eqList;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const handleCreateCustomEq = async () => {
        if (!customEqName.trim()) {
            toast.error("Please enter an equipment name");
            return;
        }
        setIsCreatingCustom(true);
        try {
            const res = await api.post('/security-equipment', { name: customEqName.trim() });
            toast.success("Custom equipment created!");
            await fetchEquipmentMaster(); // Refresh list
            setCustomEqName('');
            setShowCustomModal(false);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create equipment");
        } finally {
            setIsCreatingCustom(false);
        }
    };

    useEffect(() => {
        const initData = async () => {
            try {
                // 1. Fetch master equipment
                const eqList = await fetchEquipmentMaster();
                
                // Initialize default sections state (qty = 0)
                const initialSections = {};
                Object.keys(FIXED_SECTIONS).forEach(secName => {
                    initialSections[secName] = FIXED_SECTIONS[secName].map(eqName => {
                        const eqObj = eqList.find(e => e.name === eqName);
                        return {
                            equipment_id: eqObj ? eqObj.id : null,
                            equipment_name: eqName,
                            quantity: 0
                        };
                    });
                });

                if (isEdit) {
                    const formRes = await api.get(`/security-forms/${id}`);
                    const data = formRes.data;
                    
                    setFormData({ branch_code: data.branch_code, address: data.address, state: data.state || '' });
                    
                    if (data.section_configs) {
                        setSectionConfigs(data.section_configs);
                    }
                    
                    // Merge saved sections with defaults
                    if (data.sections) {
                        Object.keys(initialSections).forEach(secName => {
                            if (data.sections[secName]) {
                                initialSections[secName] = initialSections[secName].map(item => {
                                    const savedItem = data.sections[secName].find(s => s.equipment_id === item.equipment_id);
                                    return savedItem ? { ...item, quantity: savedItem.quantity } : item;
                                });
                            }
                        });
                    }
                    setRequirements(data.requirements || []);
                    setInstallations(data.installations || []);
                }
                
                setSections(initialSections);
            } catch (error) {
                toast.error('Failed to load data');
                console.error(error);
            } finally {
                setLoading(false);
                if (new URLSearchParams(location.search).get('print') === 'true') {
                    setTimeout(() => window.print(), 500);
                }
            }
        };
        initData();
        
    }, [id, isEdit, location.search]);

    useEffect(() => {
        // Update document title for print header and file download name
        const originalTitle = document.title;
        document.title = formData.branch_code ? `${formData.branch_code}-equipment-checklist` : "equipment-checklist";
        return () => {
            document.title = originalTitle;
        };
    }, [formData.branch_code]);

    const handleSectionQtyChange = (sectionName, equipmentName, newQty) => {
        let val = parseInt(newQty);
        if (isNaN(val) || val < 0) val = 0;
        
        setSections(prev => ({
            ...prev,
            [sectionName]: prev[sectionName].map(item => 
                item.equipment_name === equipmentName ? { ...item, quantity: val } : item
            )
        }));
    };

    // Add to Dynamic List
    const handleAddDynamic = (type) => {
        const selectedId = type === 'req' ? reqSelectedEq : instSelectedEq;
        const qty = type === 'req' ? parseInt(reqQty) : parseInt(instQty);
        
        if (!selectedId) {
            toast.error('Please select equipment');
            return;
        }
        if (isNaN(qty) || qty <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        const eqObj = equipmentMaster.find(e => e.id == selectedId);
        if (!eqObj) return;

        const newItem = {
            equipment_id: eqObj.id,
            equipment_name: eqObj.name,
            quantity: qty
        };

        const listState = type === 'req' ? requirements : installations;
        const setListState = type === 'req' ? setRequirements : setInstallations;

        // Check for duplicates
        const existingIndex = listState.findIndex(item => item.equipment_id === eqObj.id);
        if (existingIndex >= 0) {
            const updated = [...listState];
            updated[existingIndex].quantity += qty;
            setListState(updated);
            toast.success(`Merged with existing ${eqObj.name} (New Qty: ${updated[existingIndex].quantity})`);
        } else {
            setListState([...listState, newItem]);
        }

        // Reset inputs
        if (type === 'req') {
            setReqSelectedEq('');
            setReqQty(0);
        } else {
            setInstSelectedEq('');
            setInstQty(0);
        }
    };

    const handleRemoveDynamic = (type, equipmentId) => {
        if (type === 'req') {
            setRequirements(requirements.filter(i => i.equipment_id !== equipmentId));
        } else {
            setInstallations(installations.filter(i => i.equipment_id !== equipmentId));
        }
    };
    
    const handleDynamicQtyChange = (type, equipmentId, newQty) => {
        let val = parseInt(newQty);
        if (isNaN(val) || val < 0) val = 0;
        
        const listState = type === 'req' ? requirements : installations;
        const setListState = type === 'req' ? setRequirements : setInstallations;
        
        setListState(listState.map(item => 
            item.equipment_id === equipmentId ? { ...item, quantity: val } : item
        ));
    };

    const basePath = window.location.pathname.startsWith('/employee') ? '/employee' : '/admin';

    const handleSave = async () => {
        if (!formData.branch_code) {
            toast.error('Branch code is required');
            return;
        }

        setSaving(true);
        const payload = {
            branch_code: formData.branch_code,
            address: formData.address,
            state: formData.state,
            sections,
            section_configs: sectionConfigs,
            requirements,
            installations
        };

        try {
            if (isEdit) {
                await api.put(`/security-forms/${id}`, payload);
                toast.success('Form updated successfully');
            } else {
                const res = await api.post('/security-forms', payload);
                toast.success('Form created successfully');
                navigate(`${basePath}/security-requirements/${res.data.id}/edit`);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save form');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    // Helper to render a Section Box
    const renderFixedSection = (title) => {
        const items = sections[title] || [];
        const addState = fixedAddState[title] || { selectedEq: '', qty: '' };
        
        const handleAddToFixed = () => {
            if (!addState.selectedEq) {
                toast.error('Please select equipment');
                return;
            }
            const qty = parseInt(addState.qty);
            if (isNaN(qty) || qty <= 0) {
                toast.error('Quantity must be greater than 0');
                return;
            }

            const eqObj = equipmentMaster.find(e => e.id == addState.selectedEq);
            if (!eqObj) return;

            setSections(prev => {
                const currentList = prev[title] || [];
                const existingIndex = currentList.findIndex(i => i.equipment_name === eqObj.name);
                
                let updatedList = [...currentList];
                if (existingIndex >= 0) {
                    updatedList[existingIndex].quantity += qty;
                    toast.success(`Merged with existing ${eqObj.name}`);
                } else {
                    updatedList.push({
                        equipment_id: eqObj.id,
                        equipment_name: eqObj.name,
                        quantity: qty
                    });
                }
                return { ...prev, [title]: updatedList };
            });

            // Reset
            setFixedAddState(prev => ({ ...prev, [title]: { selectedEq: '', qty: '' } }));
        };

        const handleRemoveFromFixed = (eqName) => {
            setSections(prev => ({
                ...prev,
                [title]: prev[title].filter(i => i.equipment_name !== eqName)
            }));
        };

        const handleSectionConfigChange = (field, value) => {
            setSectionConfigs(prev => ({
                ...prev,
                [title]: {
                    ...prev[title],
                    [field]: value
                }
            }));
        };

        const config = sectionConfigs[title] || { status: 'AVAILABLE', mergedWith: '' };

        const mergedIntoThis = Object.entries(sectionConfigs)
            .filter(([sec, conf]) => conf.status === 'MERGED' && conf.mergedWith === title)
            .map(([sec]) => sec);

        const displayTitle = mergedIntoThis.length > 0 
            ? `${title} / ${mergedIntoThis.join(' / ')}` 
            : title;

        return (
            <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 overflow-hidden print:border-[1.5px] print:border-black print:rounded print:shadow-none print:break-inside-avoid ${config.status === 'MERGED' ? 'print:hidden' : ''}`}>
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-800 dark:text-white/90 text-sm tracking-wide flex justify-between items-center print:py-0.5 print:px-1.5 print:text-[11px] print:font-bold print:uppercase print:border-b-[1px] print:border-black print:bg-gray-100 print:!text-black">
                    <span>
                        {displayTitle} 
                        {config.status === 'NOT_AVAILABLE' && <span className="text-black dark:text-white print:!text-black ml-2">(Not Available)</span>}
                        {config.status === 'MERGED' && <span className="text-brand-500 ml-2">(Merged {config.mergedWith ? `with ${config.mergedWith}` : ''})</span>}
                    </span>
                    <div className="flex space-x-2 print:hidden">
                        <select 
                            value={config.status || 'AVAILABLE'}
                            onChange={(e) => handleSectionConfigChange('status', e.target.value)}
                            className="text-xs px-2 py-1 border-gray-300 rounded focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 font-normal outline-none"
                        >
                            <option value="AVAILABLE">Available</option>
                            <option value="NOT_AVAILABLE">Not Available (N/A)</option>
                            <option value="MERGED">Merged</option>
                        </select>
                        {config.status === 'MERGED' && (
                            <select 
                                value={config.mergedWith || ''}
                                onChange={(e) => handleSectionConfigChange('mergedWith', e.target.value)}
                                className="text-xs px-2 py-1 border-gray-300 rounded focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 font-normal outline-none"
                            >
                                <option value="">Merge with...</option>
                                {Object.keys(FIXED_SECTIONS).filter(s => s !== title).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                
                {(!config.status || config.status === 'AVAILABLE') ? (
                    <div className="p-3 grid grid-cols-2 gap-2 print:p-1 print:flex print:flex-col print:space-y-[1px] print:gap-0">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex flex-col justify-between bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm print:flex-row print:!bg-gray-200 print:!border-none print:px-1 print:py-[1px] print:text-[11px] print:leading-tight print:!rounded-[2px] print:items-center">
                            <span className="text-gray-700 dark:text-gray-200 font-semibold text-xs mb-2 line-clamp-2 print:text-[11px] print:font-bold print:!text-black print:mb-0 print:line-clamp-none print:px-1" title={item.equipment_name}>{item.equipment_name}</span>
                            <div className="flex items-center justify-between shrink-0 print:justify-end print:space-x-1">
                                <span className="text-gray-400 text-[10px] uppercase font-bold print:hidden">Qty</span>
                                <div className="flex items-center space-x-1">
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={item.quantity === 0 ? '' : item.quantity}
                                        onChange={(e) => handleQtyInputAndNext(e, (val) => handleSectionQtyChange(title, item.equipment_name, val))}
                                        placeholder="0"
                                        className="qty-input w-full max-w-[3.5rem] h-8 text-center rounded border border-gray-300 bg-white text-sm font-bold text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90 print:w-6 print:h-4 print:text-[11px] print:font-bold print:!text-black print:border-none print:p-0 print:text-center print:!bg-white print:!rounded-[2px] print:shadow-sm"
                                    />
                                    <button 
                                        onClick={() => handleRemoveFromFixed(item.equipment_name)}
                                        className="text-gray-400 hover:text-error-500 transition-colors p-1 print:hidden"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add New Item UI - Hidden in Print */}
                    <div className="col-span-2 mt-1 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1 print:hidden">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select 
                                value={addState.selectedEq}
                                onChange={e => setFixedAddState(prev => ({ ...prev, [title]: { ...addState, selectedEq: e.target.value } }))}
                                className="flex-1 rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900"
                            >
                                <option value="">Add Equipment...</option>
                                {equipmentMaster.map(eq => (
                                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                                ))}
                            </select>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="number" 
                                    min="0" 
                                    placeholder="Qty"
                                    value={addState.qty === 0 ? '' : addState.qty}
                                    onChange={e => setFixedAddState(prev => ({ ...prev, [title]: { ...addState, qty: e.target.value } }))}
                                    className="w-14 rounded-lg border border-gray-300 bg-transparent px-1 py-1.5 text-center text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddToFixed}
                                    className="inline-flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors shrink-0"
                                    title="Add Item"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setShowCustomModal(true)}
                            className="text-[10px] text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 self-start font-medium transition-colors"
                        >
                            + Create custom item
                        </button>
                    </div>
                </div>
                ) : (
                    <div className="p-4 text-center text-sm text-black dark:text-white bg-gray-50/50 dark:bg-gray-900/50 print:hidden border-t border-dashed border-gray-200 dark:border-gray-700 font-medium">
                        {config.status === 'NOT_AVAILABLE' 
                            ? "This section has been marked as Not Available (N/A)."
                            : `This section is merged into ${config.mergedWith || 'another section'}.`}
                    </div>
                )}
            </div>
        );
    };

    const renderDynamicSection = (title, type) => {
        const list = type === 'req' ? requirements : installations;
        const selectedEq = type === 'req' ? reqSelectedEq : instSelectedEq;
        const qty = type === 'req' ? reqQty : instQty;
        const setSelectedEq = type === 'req' ? setReqSelectedEq : setInstSelectedEq;
        const setQty = type === 'req' ? setReqQty : setInstQty;

        return (
            <div className={`rounded-xl border border-brand-200 bg-white dark:border-brand-900/30 dark:bg-white/3 overflow-hidden shadow-sm print:border-[1.5px] print:border-black print:rounded print:shadow-none print:break-inside-avoid ${list.length === 0 ? 'print:hidden' : ''}`}>
                <div className="bg-brand-50 dark:bg-brand-500/10 px-4 py-3 border-b border-brand-100 dark:border-brand-900/30 print:py-0.5 print:px-1.5 print:border-b-[1px] print:border-black print:bg-gray-100">
                    <h3 className="font-bold text-brand-700 dark:text-brand-400 print:!text-black print:text-[11px] print:uppercase">{title}</h3>
                </div>
                <div className="p-4 space-y-4 print:p-1 print:space-y-[1px]">
                    <div className="flex flex-col gap-2 print:hidden">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select 
                                value={selectedEq}
                                onChange={e => setSelectedEq(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900"
                            >
                                <option value="">Select Equipment ▼</option>
                                {equipmentMaster.map(eq => (
                                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                                ))}
                            </select>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="number" 
                                    min="0" 
                                    placeholder="Qty"
                                    value={qty === 0 ? '' : qty}
                                    onChange={e => setQty(e.target.value)}
                                    className="w-16 rounded-lg border border-gray-300 bg-transparent px-2 py-2 text-center text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                                />
                                <button 
                                    type="button"
                                    onClick={() => handleAddDynamic(type)}
                                    className="inline-flex items-center justify-center rounded-lg bg-brand-500 p-2 text-white hover:bg-brand-600 transition-colors shrink-0"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setShowCustomModal(true)}
                            className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 self-start mt-1 font-medium transition-colors"
                        >
                            + Can't find it? Create custom item
                        </button>
                    </div>
                    
                    {list.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 print:mt-0 print:pt-0 print:border-none print:flex print:flex-col print:space-y-[1px] print:gap-0">
                            {list.map((item, idx) => (
                                <div key={idx} className="flex flex-col justify-between bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm print:flex-row print:!bg-gray-200 print:!border-none print:px-1 print:py-[1px] print:text-[11px] print:leading-tight print:!rounded-[2px] print:items-center">
                                    <span className="text-gray-700 dark:text-gray-200 font-semibold text-xs mb-2 line-clamp-2 print:text-[11px] print:font-bold print:!text-black print:mb-0 print:line-clamp-none print:px-1">{item.equipment_name}</span>
                                    <div className="flex items-center justify-between shrink-0 print:justify-end print:space-x-1">
                                        <span className="text-gray-400 text-[10px] uppercase font-bold print:hidden">Qty</span>
                                        <div className="flex items-center space-x-1">
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={item.quantity === 0 ? '' : item.quantity}
                                                onChange={(e) => handleQtyInputAndNext(e, (val) => handleDynamicQtyChange(type, item.equipment_id, val))}
                                                className="qty-input w-full max-w-[3.5rem] h-8 text-center rounded border border-gray-300 bg-white text-sm font-bold text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90 print:w-6 print:h-4 print:text-[11px] print:font-bold print:!text-black print:border-none print:p-0 print:text-center print:!bg-white print:!rounded-[2px] print:shadow-sm"
                                            />
                                            <button 
                                                onClick={() => handleRemoveDynamic(type, item.equipment_id)}
                                                className="text-gray-400 hover:text-error-500 transition-colors p-1 print:hidden"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {list.length === 0 && (
                        <p className="text-sm text-gray-400 text-center italic py-2 print:hidden">No items added yet</p>
                    )}
                </div>
            </div>
        );
    };

    // Calculate Totals
    const calculateTotals = () => {
        let existingEqBreakdown = {};
        let reqEqBreakdown = {};
        let instEqBreakdown = {};
        let fixed = 0;
        let req = 0;
        let inst = 0;
        
        const getSummaryName = (name) => {
            if (!name) return '';
            if (name === 'M.S Bank to ATM') return name;
            if (name.includes('M.S')) return 'M.S';
            return name;
        };
        
        Object.values(sections).forEach(sec => {
            sec.forEach(item => {
                let qty = parseInt(item.quantity) || 0;
                if (qty > 0) {
                    const summaryName = getSummaryName(item.equipment_name);
                    existingEqBreakdown[summaryName] = (existingEqBreakdown[summaryName] || 0) + qty;
                    fixed += qty;
                }
            });
        });
        
        requirements.forEach(item => {
            let qty = parseInt(item.quantity) || 0;
            if (qty > 0) {
                const summaryName = getSummaryName(item.equipment_name);
                reqEqBreakdown[summaryName] = (reqEqBreakdown[summaryName] || 0) + qty;
                req += qty;
            }
        });
        
        installations.forEach(item => {
            let qty = parseInt(item.quantity) || 0;
            if (qty > 0) {
                const summaryName = getSummaryName(item.equipment_name);
                instEqBreakdown[summaryName] = (instEqBreakdown[summaryName] || 0) + qty;
                inst += qty;
            }
        });
        
        return { existingEqBreakdown, reqEqBreakdown, instEqBreakdown, fixed, req, inst, all: fixed + req + inst };
    };
    const totals = calculateTotals();

    return (
        <div id="printable-security-form" className="space-y-6 pb-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 print:hidden">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(`${basePath}/security-requirements`)} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                        {isEdit ? 'Edit Security Requirement' : 'New Security Requirement'}
                    </h1>
                </div>
                {isEdit && (
                    <button 
                        onClick={() => window.print()} 
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-500 text-brand-600 px-4 py-2 text-theme-sm font-medium hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 transition-colors bg-white dark:bg-transparent"
                    >
                        <Printer className="w-5 h-5" />
                        <span>Download PDF</span>
                    </button>
                )}
            </div>

            {/* Print Only Heading */}
            <h1 className="hidden print:block text-center text-lg font-extrabold text-black uppercase tracking-widest mb-1.5 border-b-[1.5px] border-black pb-1">
                Equipment Checklist {formData.branch_code && `- ${formData.branch_code}`}
            </h1>

            {/* Top Branch Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/3 print:p-2 print:border-[1.5px] print:border-black print:!rounded-sm print:shadow-none print:!bg-white print:break-inside-avoid print:!text-black">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                    <div className="print:flex print:items-center print:border-b-[1px] print:border-gray-300 print:pb-1.5">
                        <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider print:text-[13px] print:font-bold print:!text-black print:mb-0 print:w-28">Branch Code:</label>
                        <input 
                            type="text" 
                            value={formData.branch_code}
                            onChange={e => setFormData({...formData, branch_code: e.target.value})}
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-mono text-theme-sm text-gray-800 outline-none focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900/50 dark:text-white/90 print:!bg-transparent print:!border-none print:!rounded-none print:!px-0 print:!py-0 print:text-[13px] print:!text-black print:font-bold print:flex-1"
                            placeholder="Enter Branch Code"
                        />
                    </div>
                    <div className="print:flex print:items-start print:pt-1">
                        <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider print:text-[13px] print:font-bold print:!text-black print:mb-0 print:w-28 print:pt-0">Address:</label>
                        <textarea 
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            rows="2"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-theme-sm text-gray-800 outline-none focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900/50 dark:text-white/90 print:!bg-transparent print:!border-none print:!rounded-none print:!px-0 print:!py-0 print:text-[13px] print:!text-black print:font-bold print:resize-none print:flex-1"
                            placeholder="Enter Full Address"
                        />
                    </div>
                    <div className="print:flex print:items-start print:pt-1">
                        <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider print:text-[13px] print:font-bold print:!text-black print:mb-0 print:w-28 print:pt-0">State:</label>
                        <select 
                            value={formData.state}
                            onChange={e => setFormData({...formData, state: e.target.value})}
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-theme-sm text-gray-800 outline-none focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900/50 dark:text-white/90 print:!bg-transparent print:!border-none print:!rounded-none print:!px-0 print:!py-0 print:text-[13px] print:!text-black print:font-bold print:flex-1 appearance-none"
                        >
                            <option value="">Select State</option>
                            {Object.keys(holidays2026).map(st => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 3-Column Layout matching Reference Image */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-1.5 print:text-xs">
                
                {/* Column 1: Outside, ATM, Lobby */}
                <div className="space-y-6 print:space-y-1.5">
                    {renderFixedSection('Branch Outside')}
                    {renderFixedSection('ATM Inside')}
                    {renderFixedSection('Branch Lobby')}
                </div>

                {/* Column 2: Vault, Gold, Cash, BM */}
                <div className="space-y-6 print:space-y-1.5">
                    {renderFixedSection('Vault Room')}
                    {renderFixedSection('Gold Loan')}
                    {renderFixedSection('Cash Counter')}
                    {renderFixedSection('BM Cabin')}
                </div>

                {/* Column 3: Info, Server, Requirements, Installation */}
                <div className="space-y-6 print:space-y-1.5">
                    {renderFixedSection('Server Room')}
                    {renderDynamicSection('Requirements', 'req')}
                    {renderDynamicSection('New Installation', 'inst')}
                </div>
            </div>

            {/* Summary Card - Forced to Page 2 on Print */}
            <div className="mt-8 print:break-before-page print:mt-0" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/30 print:border-2 print:border-gray-800 print:bg-white print:p-6 print:rounded-xl">
                    <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-2 print:text-2xl print:text-black print:font-extrabold print:border-b-4 print:border-black print:mb-8 print:pb-4">Summary / Totals</h4>
                    <div className="space-y-6 text-sm print:text-sm">
                        
                        {/* Existing Equipment Breakdown */}
                        <div className="print:break-inside-avoid mb-6 print:mb-8">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-2 print:mb-4 print:border-black print:border-b-[1.5px] print:pb-1.5">
                                <div className="font-semibold text-brand-600 dark:text-brand-400 print:text-sm print:font-bold print:text-black print:uppercase">Existing Equipment Breakdown</div>
                                <div className="text-sm font-bold text-gray-800 dark:text-white print:text-sm print:text-black">Total: {totals.fixed} Items</div>
                            </div>
                            {Object.entries(totals.existingEqBreakdown).length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-3">
                                    {Object.entries(totals.existingEqBreakdown).map(([name, qty]) => (
                                        <div key={name} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-700 print:border print:border-black print:bg-white print:p-2 print:rounded">
                                            <span className="text-gray-600 dark:text-gray-300 font-medium truncate pr-1 print:font-bold print:text-black print:text-[13px]" title={name}>{name}</span>
                                            <span className="font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded print:text-[13px] print:text-black print:bg-transparent print:p-0">{qty}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic text-xs">No existing equipment entered</div>
                            )}
                        </div>

                        {/* Requirements Breakdown */}
                        <div className="print:break-inside-avoid mb-6 print:mb-8">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-2 print:mb-4 print:border-black print:border-b-[1.5px] print:pb-1.5">
                                <div className="font-semibold text-brand-600 dark:text-brand-400 print:text-sm print:font-bold print:text-black print:uppercase">Requirements Breakdown</div>
                                <div className="text-sm font-bold text-gray-800 dark:text-white print:text-sm print:text-black">Total: {totals.req} Items</div>
                            </div>
                            {Object.entries(totals.reqEqBreakdown).length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-3">
                                    {Object.entries(totals.reqEqBreakdown).map(([name, qty]) => (
                                        <div key={name} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-700 print:border print:border-black print:bg-white print:p-2 print:rounded">
                                            <span className="text-gray-600 dark:text-gray-300 font-medium truncate pr-1 print:font-bold print:text-black print:text-[13px]" title={name}>{name}</span>
                                            <span className="font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded print:text-[13px] print:text-black print:bg-transparent print:p-0">{qty}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic text-xs">No requirements entered</div>
                            )}
                        </div>

                        {/* New Installation Breakdown */}
                        <div className="print:break-inside-avoid mb-6 print:mb-8">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-2 print:mb-4 print:border-black print:border-b-[1.5px] print:pb-1.5">
                                <div className="font-semibold text-brand-600 dark:text-brand-400 print:text-sm print:font-bold print:text-black print:uppercase">New Installation Breakdown</div>
                                <div className="text-sm font-bold text-gray-800 dark:text-white print:text-sm print:text-black">Total: {totals.inst} Items</div>
                            </div>
                            {Object.entries(totals.instEqBreakdown).length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-3">
                                    {Object.entries(totals.instEqBreakdown).map(([name, qty]) => (
                                        <div key={name} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-700 print:border print:border-black print:bg-white print:p-2 print:rounded">
                                            <span className="text-gray-600 dark:text-gray-300 font-medium truncate pr-1 print:font-bold print:text-black print:text-[13px]" title={name}>{name}</span>
                                            <span className="font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded print:text-[13px] print:text-black print:bg-transparent print:p-0">{qty}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic text-xs">No new installations entered</div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end bg-white dark:bg-gray-900 p-4 rounded-xl border print:border-none print:pt-4 print:break-inside-avoid">
                            <div className="text-right">
                                <div className="text-brand-600 dark:text-brand-400 font-bold text-sm uppercase mb-1 print:text-lg print:text-black">Overall Grand Total Items</div>
                                <div className="font-extrabold text-3xl text-brand-600 dark:text-brand-400 print:text-3xl print:text-black">{totals.all}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 flex justify-end z-40 shadow-lg print:hidden">
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Form'}</span>
                </button>
            </div>

            {/* Custom Equipment Modal */}
            {showCustomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Create Custom Equipment</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This will permanently add the item to the master list.</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Equipment Name</label>
                            <input 
                                type="text"
                                autoFocus
                                value={customEqName}
                                onChange={e => setCustomEqName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateCustomEq()}
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900/50 dark:text-white/90"
                                placeholder="e.g., Special Siren"
                            />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                            <button 
                                onClick={() => { setShowCustomModal(false); setCustomEqName(''); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateCustomEq}
                                disabled={isCreatingCustom || !customEqName.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                            >
                                {isCreatingCustom ? 'Saving...' : 'Save & Add to List'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityFormEdit;
