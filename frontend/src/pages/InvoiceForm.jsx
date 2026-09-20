import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft, Download, FileText, FileSpreadsheet } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import api from '../utils/api';
import SignatureUploader from '../components/SignatureUploader';

const getAmountInWords = (amount) => {
    if (!amount || amount === 0) return '';
    const num = Math.floor(amount);
    const point = Math.round((amount - num) * 100);
    
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const inWords = (n) => {
        if (n === 0) return '';
        if (n < 20) return a[n] + ' ';
        let s = b[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) s += a[n % 10] + ' ';
        return s;
    };
    
    let res = '';
    let crore = Math.floor(num / 10000000);
    let lakh = Math.floor((num % 10000000) / 100000);
    let thousand = Math.floor((num % 100000) / 1000);
    let hundred = Math.floor((num % 1000) / 100);
    let rest = num % 100;
    
    if (crore > 0) res += inWords(crore) + 'Crore ';
    if (lakh > 0) res += inWords(lakh) + 'Lakh ';
    if (thousand > 0) res += inWords(thousand) + 'Thousand ';
    if (hundred > 0) res += inWords(hundred) + 'Hundred ';
    if (rest > 0) res += inWords(rest);
    
    res = res.trim();
    if (res.length > 0) res += ' Rupees';
    
    if (point > 0) {
        if (res.length > 0) res += ' and ';
        res += inWords(point).trim() + ' Paise';
    }
    
    if (res.length > 0) res += ' Only.';
    
    return res;
};

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  
  const [invoice, setInvoice] = useState(() => {
    if (!id) {
      const saved = localStorage.getItem('draft_invoice');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.signature_image === '') parsed.signature_image = null;
        return parsed;
      }
    }
    return {
      invoice_no: '',
      invoice_date: new Date().toISOString().split('T')[0],
      payment_terms: 'As mutually agreed',
      client_name: '',
      client_address: '',
      project_site_details: '',
      client_project: '',
      site_id: '',
      location: '',
      amount_in_words: '',
      status: 'PENDING',
      signature_image: null,
      terms_conditions: [
        "This bill is raised for the services/charges mentioned above.",
        "Payment shall be made to the bank account details mentioned in this invoice.",
        "Any applicable taxes, statutory deductions, or withholding shall be dealt with as mutually agreed between the parties.",
        "Any discrepancy in this bill should be communicated to the vendor within 7 days of receipt.",
        "This invoice is subject to mutual confirmation of the services/charges and supporting site records, where applicable."
      ]
    };
  });

  const [vendor, setVendor] = useState(() => {
    if (!id) {
      const saved = localStorage.getItem('draft_vendor');
      if (saved) return JSON.parse(saved);
    }
    return {
      name: '',
      address: '',
      email: '',
      pan_no: '',
      bank_holder_name: '',
      bank_name: '',
      account_no: '',
      ifsc_code: '',
      bank_address: '',
      signature_image: ''
    };
  });

  const [items, setItems] = useState(() => {
    if (!id) {
      const saved = localStorage.getItem('draft_items');
      if (saved) return JSON.parse(saved);
    }
    return [{ id: 1, description: '', qty: 1, rate: 0, amount: 0, project_site_details: '', client_project: '', site_id: '', location: '' }];
  });

  useEffect(() => {
    // Only set if they actually have content, prevents overwriting with blanks
    if (!id && invoice.invoice_no) {
      localStorage.setItem('draft_invoice', JSON.stringify(invoice));
    }
  }, [invoice, id]);

  useEffect(() => {
    if (!id && vendor.name) {
      localStorage.setItem('draft_vendor', JSON.stringify(vendor));
    }
  }, [vendor, id]);

  useEffect(() => {
    if (!id && items.length > 1) {
      localStorage.setItem('draft_items', JSON.stringify(items));
    }
  }, [items, id]);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    } else {
      // Always fetch latest default vendor settings for a new invoice
      fetchVendor();
      if (!invoice.invoice_no) generateInvoiceNumber();
    }
  }, [id]);

  useEffect(() => {
    const total = calculateTotal();
    setInvoice(prev => ({
      ...prev,
      amount_in_words: getAmountInWords(total)
    }));
  }, [items]);

  const fetchVendor = async () => {
    try {
      const res = await api.get('/vendors');
      if (res.data && Object.keys(res.data).length > 0) {
        setVendor(prev => ({
          ...prev,
          ...res.data,
          signature_image: res.data.signature_image || prev.signature_image
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const nextYear = parseInt(year) + 1;
    setInvoice(prev => ({ ...prev, invoice_no: `INV/${year}-${nextYear}/001` }));
  };

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      const { items: fetchedItems, ...invData } = res.data;
      setInvoice({
        ...invData,
        signature_image: invData.signature_image ?? null,
        terms_conditions: invData.terms_conditions ? JSON.parse(invData.terms_conditions) : invoice.terms_conditions
      });
      if (fetchedItems && fetchedItems.length > 0) {
        setItems(fetchedItems.map(item => ({...item, id: Math.random()})));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
  };

  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (itemId, field, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          updatedItem.amount = (parseFloat(updatedItem.qty) || 0) * (parseFloat(updatedItem.rate) || 0);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Math.random(), description: '', qty: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (itemId) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Save vendor details globally
      await api.post('/vendors', vendor);

      // 2. Save invoice
      const payload = {
        ...invoice,
        total_amount: calculateTotal(),
        items: items.map((item, index) => ({ ...item, sr_no: index + 1 })),
        terms_conditions: JSON.stringify(invoice.terms_conditions)
      };

      if (id) {
        await api.put(`/invoices/${id}`, payload);
        toast.success('Invoice updated successfully');
      } else {
        const res = await api.post('/invoices', payload);
        toast.success('Invoice created successfully');
        localStorage.removeItem('draft_invoice');
        localStorage.removeItem('draft_vendor');
        localStorage.removeItem('draft_items');
        navigate(`/invoice/${res.data.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      toast.error('Failed to save invoice: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading invoice...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 font-sans px-4 sm:px-6 lg:px-8 pt-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button onClick={() => navigate('/')} className="flex items-center text-slate-600 hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex flex-wrap items-center gap-3">
          {id && (
            <>
              <button
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || '/invoice_backend/api'}/invoices/${id}/pdf`}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || '/invoice_backend/api'}/invoices/${id}/excel`}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-2 bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/30 transition-all disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Invoice'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">INVOICE</h1>
            <p className="text-slate-500 mt-1">Service Bill Details</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col items-end gap-3 w-full sm:w-auto">
             <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <label className="text-sm font-semibold text-slate-600">Invoice No:</label>
                <input type="text" name="invoice_no" value={invoice.invoice_no} onChange={handleInvoiceChange} className="border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium w-40 text-right" />
             </div>
             <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <label className="text-sm font-semibold text-slate-600">Date:</label>
                <DatePicker
                  selected={invoice.invoice_date ? new Date(invoice.invoice_date) : null}
                  onChange={(date) => {
                    if (date) {
                      // Add timezone offset to prevent date shifting backwards due to UTC
                      const offset = date.getTimezoneOffset() * 60000;
                      const localDate = new Date(date.getTime() - offset);
                      const formattedDate = localDate.toISOString().split('T')[0];
                      handleInvoiceChange({ target: { name: 'invoice_date', value: formattedDate } });
                    } else {
                      handleInvoiceChange({ target: { name: 'invoice_date', value: '' } });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  className="border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none w-40 text-right"
                  wrapperClassName="w-full sm:w-auto"
                />
             </div>
          </div>
        </div>

        {/* Parties Grid (Vendor & Client) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vendor Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center border-b border-slate-100 pb-2">
              Vendor Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Vendor Name</label>
                <input type="text" name="name" value={vendor.name} onChange={handleVendorChange} placeholder="Enter vendor name" className="w-full border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                <textarea name="address" value={vendor.address} onChange={handleVendorChange} placeholder="Enter vendor address" rows="2" className="w-full resize-none border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors"></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contact No</label>
                  <input type="text" placeholder="Contact number" className="w-full border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email ID</label>
                  <input type="email" name="email" value={vendor.email} onChange={handleVendorChange} placeholder="vendor@example.com" className="w-full border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">PAN No</label>
                <input type="text" name="pan_no" value={vendor.pan_no} onChange={handleVendorChange} placeholder="ABCDE1234F" className="w-full uppercase border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors" />
              </div>
            </div>
          </div>

          {/* Client Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center border-b border-slate-100 pb-2">
              Bill To (Client)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Client Name</label>
                <input type="text" name="client_name" value={invoice.client_name} onChange={handleInvoiceChange} placeholder="Enter client name" className="w-full border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Client Address</label>
                <textarea name="client_address" value={invoice.client_address} onChange={handleInvoiceChange} placeholder="Enter client address" rows="2" className="w-full resize-none border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors"></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Terms</label>
                <input type="text" name="payment_terms" value={invoice.payment_terms} onChange={handleInvoiceChange} placeholder="e.g. As mutually agreed" className="w-full border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-primary to-secondary text-white flex justify-between items-center">
            <h2 className="text-lg font-bold">Line Items</h2>
            <button onClick={addItem} className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> <span>Add Item</span>
            </button>
          </div>
          
          <div className="p-4 sm:p-6 bg-slate-50/50">
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 relative shadow-sm hover:shadow-md transition-shadow group">
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">#{idx + 1}</span>
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Remove item">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 lg:mt-0">
                    {/* Project Details */}
                    <div className="lg:col-span-5 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Project / Site Details</label>
                        <input type="text" value={item.project_site_details || ''} onChange={(e) => handleItemChange(item.id, 'project_site_details', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Site Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Client Project</label>
                          <input type="text" value={item.client_project || ''} onChange={(e) => handleItemChange(item.id, 'client_project', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Project" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Site ID</label>
                          <input type="text" value={item.site_id || ''} onChange={(e) => handleItemChange(item.id, 'site_id', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="ID" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Location</label>
                        <input type="text" value={item.location || ''} onChange={(e) => handleItemChange(item.id, 'location', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Location" />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="lg:col-span-4">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                      <textarea value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full h-full min-h-[120px] lg:min-h-[160px] resize-none border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter detailed description..."></textarea>
                    </div>

                    {/* Pricing */}
                    <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Qty</label>
                          <input type="number" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-right" min="1" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Rate (₹)</label>
                          <input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-right" step="0.01" />
                        </div>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-3 text-right border border-primary/10 h-full flex flex-col justify-end">
                        <label className="block text-xs font-semibold text-primary mb-1">Amount</label>
                        <div className="text-xl font-bold text-primary">₹{parseFloat(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-end items-end sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-full sm:w-auto flex-1 mr-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Amount in Words</label>
                <div className="font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{invoice.amount_in_words || 'Zero Rupees Only.'}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Amount</div>
                <div className="text-3xl font-black text-primary">₹{calculateTotal().toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank & Payment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-primary mb-4 border-b border-slate-100 pb-2">Bank / Payment Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Account Holder Name</label>
              <input type="text" name="bank_holder_name" value={vendor.bank_holder_name} onChange={handleVendorChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
              <input type="text" name="bank_name" value={vendor.bank_name} onChange={handleVendorChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Account No.</label>
              <input type="text" name="account_no" value={vendor.account_no} onChange={handleVendorChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">IFSC Code</label>
              <input type="text" name="ifsc_code" value={vendor.ifsc_code} onChange={handleVendorChange} className="w-full uppercase border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Address</label>
              <input type="text" name="bank_address" value={vendor.bank_address} onChange={handleVendorChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
          </div>
        </div>

        {/* Terms and Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Terms */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-primary mb-4 border-b border-slate-100 pb-2">Terms & Conditions</h2>
            <div className="space-y-2">
              {invoice.terms_conditions.map((term, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm font-bold text-primary mt-1.5">{i + 1}.</span>
                  <input 
                    type="text" 
                    value={term}
                    onChange={(e) => {
                      const newTerms = [...invoice.terms_conditions];
                      newTerms[i] = e.target.value;
                      setInvoice({...invoice, terms_conditions: newTerms});
                    }}
                    className="flex-1 border-b border-slate-200 hover:border-primary focus:border-primary focus:outline-none py-1 text-sm text-slate-700 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Signatures */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
            <h2 className="text-lg font-bold text-primary mb-4 border-b border-slate-100 pb-2">Signatures</h2>
            <div className="flex-1 flex flex-col sm:flex-row gap-8 justify-between items-center text-center mt-4">
              <div className="flex flex-col items-center w-full">
                <span className="text-sm font-semibold text-slate-500 mb-2">Vendor / Authorized Signatory</span>
                <div className="h-28 flex items-center justify-center w-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 mb-3 hover:bg-slate-100 transition-colors">
                  <SignatureUploader 
                    signature={invoice.signature_image ?? vendor.signature_image} 
                    setSignature={(sig) => setInvoice(prev => ({ ...prev, signature_image: sig }))}
                    inline={true}
                  />
                </div>
                <span className="text-sm font-bold text-slate-800">{vendor.name || 'Vendor Name'}</span>
              </div>
              <div className="w-px h-full bg-slate-200 hidden sm:block"></div>
              <div className="flex flex-col items-center w-full h-full justify-end">
                <span className="text-sm font-semibold text-slate-500 mb-12">Customer Acknowledgement</span>
                <div className="w-full border-b-2 border-slate-300 mt-auto mb-2"></div>
                <span className="text-sm font-medium text-slate-400">Signature</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceForm;
