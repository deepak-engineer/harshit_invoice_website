import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, MapPin, Mail, CreditCard, Building, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import SignatureUploader from '../components/SignatureUploader';

const VendorSettings = () => {
  const [vendor, setVendor] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const [savingCreds, setSavingCreds] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminCreds.username && !adminCreds.password) {
        toast.error('Please enter a new username or password');
        return;
    }
    setSavingCreds(true);
    try {
        const res = await api.post('/admin/update-credentials', adminCreds);
        toast.success(res.data.message || 'Credentials updated successfully');
        setAdminCreds({ username: '', password: '' });
    } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to update credentials');
    } finally {
        setSavingCreds(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, []);

  const fetchVendor = async () => {
    try {
      const res = await api.get('/vendors');
      if (res.data && Object.keys(res.data).length > 0) {
        setVendor(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendor', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vendors', vendor);
      toast.success('Vendor details saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving details.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Vendor Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Default details that will appear on your invoices</p>
      </div>

      
      {/* Admin Login Credentials */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="text-lg font-bold text-primary mb-4 flex items-center border-b border-gray-100 dark:border-gray-800 pb-2">
          <Lock className="w-5 h-5 mr-2" />
          Admin Login Credentials
        </h2>
        <form onSubmit={handleAdminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Username</label>
            <input type="text" value={adminCreds.username} onChange={(e) => setAdminCreds({...adminCreds, username: e.target.value})} placeholder="Leave blank to keep current" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input type="password" value={adminCreds.password} onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})} placeholder="Leave blank to keep current" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={savingCreds} className="flex items-center space-x-2 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white px-5 py-2 rounded-xl font-medium transition-all disabled:opacity-70">
              <Save className="w-4 h-4" />
              <span>{savingCreds ? 'Updating...' : 'Update Login Details'}</span>
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center border-b border-gray-100 dark:border-gray-800 pb-2">
            <Building className="w-5 h-5 mr-2" />
            Company Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company / Vendor Name</label>
              <input type="text" name="name" value={vendor.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" name="email" value={vendor.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN No.</label>
              <input type="text" name="pan_no" value={vendor.pan_no} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <textarea name="address" value={vendor.address} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white"></textarea>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center border-b border-gray-100 dark:border-gray-800 pb-2">
            <CreditCard className="w-5 h-5 mr-2" />
            Bank & Payment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Holder Name</label>
              <input type="text" name="bank_holder_name" value={vendor.bank_holder_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
              <input type="text" name="bank_name" value={vendor.bank_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account No.</label>
              <input type="text" name="account_no" value={vendor.account_no} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
              <input type="text" name="ifsc_code" value={vendor.ifsc_code} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Address</label>
              <textarea name="bank_address" value={vendor.bank_address} onChange={handleChange} rows="2" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-800 dark:text-white"></textarea>
            </div>
          </div>
        </div>

        {/* Signature Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center border-b border-gray-100 dark:border-gray-800 pb-2">
            Authorized Signatory
          </h2>
          <div>
            <SignatureUploader 
              signature={vendor.signature_image} 
              setSignature={(sig) => setVendor(prev => ({ ...prev, signature_image: sig }))}
              label="Default Vendor Signature"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorSettings;
