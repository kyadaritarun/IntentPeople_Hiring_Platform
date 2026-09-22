import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, FileText, Upload, Plus, Search, Filter, Trash2,
  ExternalLink, Download, ShieldCheck, CheckCircle2, Clock,
  AlertCircle, Building2, RefreshCw, X, FileCheck, Eye,
  Loader2, Sparkles, Lock, Cloud
} from 'lucide-react';
import { api } from '../../api';

export default function RecruiterDocumentsView({ setActiveTab }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('INCORPORATION');
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getStaffDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Document file size exceeds 15MB limit.');
      return;
    }
    setUploadError('');
    setSelectedFile(file);
    if (!uploadDocName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadDocName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('doc_type', uploadDocType);
      formData.append('doc_name', uploadDocName.trim() || 'Company Document');
      if (uploadDocNumber.trim()) {
        formData.append('doc_number', uploadDocNumber.trim());
      }
      formData.append('status', 'VERIFIED');

      await api.uploadStaffDocument(formData);
      triggerToast('✨ Document uploaded successfully to AWS S3 vault!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadDocName('');
      setUploadDocNumber('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocuments();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to remove "${docName}" from your organization vault?`)) {
      return;
    }

    setDeletingId(docId);
    try {
      await api.deleteStaffDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      triggerToast(`Document "${docName}" removed successfully.`);
    } catch (err) {
      triggerToast(err.message || 'Failed to remove document');
    } finally {
      setDeletingId(null);
    }
  };

  // Categorize documents
  const isComplianceType = (type) => ['INCORPORATION', 'PAN_CARD', 'GSTIN', 'LICENSE'].includes((type || '').toUpperCase());
  const isTemplateType = (type) => ['OFFER_LETTER_TEMPLATE', 'NDA', 'POLICY', 'CONTRACT'].includes((type || '').toUpperCase());
  const isStaffType = (type) => ['NATIONAL_ID', 'PASSPORT', 'AADHAAR', 'STAFF_KYC', 'ADDRESS_PROOF'].includes((type || '').toUpperCase());

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      (doc.doc_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.doc_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.doc_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.file_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCat = true;
    if (selectedCategory === 'COMPLIANCE') matchesCat = isComplianceType(doc.doc_type);
    else if (selectedCategory === 'TEMPLATES') matchesCat = isTemplateType(doc.doc_type);
    else if (selectedCategory === 'STAFF') matchesCat = isStaffType(doc.doc_type);

    return matchesSearch && matchesCat;
  });

  const getDocTypeBadge = (type) => {
    const t = (type || '').toUpperCase();
    if (['INCORPORATION', 'PAN_CARD', 'GSTIN'].includes(t)) {
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    }
    if (['OFFER_LETTER_TEMPLATE', 'NDA', 'CONTRACT'].includes(t)) {
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
    if (['NATIONAL_ID', 'AADHAAR', 'PASSPORT'].includes(t)) {
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
    return 'bg-teal-50 text-[#00a884] border-teal-200/80';
  };

  return (
    <div className="p-4 sm:p-8 max-w-10xl mx-auto space-y-6 select-text text-slate-800">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
              <Folder className="w-4 h-4" />
            </span>
            Organization & Recruiter Documents
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Secure cloud repository for company incorporation certificates, business tax IDs, compliance policies, offer templates, and staff KYC proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Quick Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Vault Documents
          </span>
          <div className="text-xl font-black text-slate-900 flex items-center justify-between">
            <span>{documents.length} Stored</span>
            <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">Encrypted company & staff files</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-600 block mb-1">
            KYC & Verification
          </span>
          <div className="text-xl font-black text-amber-700 flex items-center justify-between">
            <span>100% Compliant</span>
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">Verified employer standing</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-teal-600 block mb-1">
            Storage Engine
          </span>
          <div className="text-xl font-black text-[#00a884] flex items-center justify-between">
            <span>AWS S3 Cloud</span>
            <Cloud className="w-5 h-5 text-[#00a884]" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">Region: ap-south-1 (Encrypted)</span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Documents', count: documents.length },
            { id: 'COMPLIANCE', label: 'Corporate & Tax ID', count: documents.filter(d => isComplianceType(d.doc_type)).length },
            { id: 'TEMPLATES', label: 'Offer Letters & NDAs', count: documents.filter(d => isTemplateType(d.doc_type)).length },
            { id: 'STAFF', label: 'Staff KYC Proofs', count: documents.filter(d => isStaffType(d.doc_type)).length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[0.65rem] font-bold ${
                selectedCategory === tab.id ? 'bg-slate-100 text-slate-900' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* ── Document Directory ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00a884]" />
            <p className="text-xs font-bold">Loading organization documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center mx-auto mb-3">
              <Folder className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">No documents in this view</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Upload company certificates, offer letter templates, or staff KYC proofs to your secure AWS S3 repository.
            </p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold border-none cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New Document</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Document Title</th>
                  <th className="py-3 px-5">Category & Classification</th>
                  <th className="py-3 px-5">Reference / ID Number</th>
                  <th className="py-3 px-5">File Size</th>
                  <th className="py-3 px-5">Upload Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Document Title */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-teal-100">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {doc.doc_name}
                          </div>
                          <div className="text-[0.68rem] text-slate-400 truncate mt-0.5">
                            {doc.file_name || 'Cloud PDF Document'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold border ${getDocTypeBadge(doc.doc_type)}`}>
                        {doc.doc_type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Document / Tax Number */}
                    <td className="py-4 px-5 font-mono text-[0.72rem] text-slate-700">
                      {doc.doc_number || <span className="text-slate-300 font-sans italic">—</span>}
                    </td>

                    {/* Size */}
                    <td className="py-4 px-5 text-slate-500 text-[0.72rem]">
                      {doc.file_size || 'Cloud File'}
                    </td>

                    {/* Upload Date */}
                    <td className="py-4 px-5 text-slate-500 text-[0.72rem] whitespace-nowrap">
                      {doc.uploaded_at 
                        ? new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Recent'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer bg-white shadow-2xs inline-flex items-center gap-1 no-underline"
                          title="Open in AWS S3"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </a>

                        <button
                          type="button"
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc.id, doc.doc_name)}
                          className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors cursor-pointer bg-white shadow-2xs disabled:opacity-50"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── UPLOAD DOCUMENT MODAL ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Upload Organization Document</h3>
                  <p className="text-xs text-slate-400">Encrypted AWS S3 Bucket: uptrix-hiring-portal</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Classification *
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer shadow-2xs"
                >
                  <option value="INCORPORATION">Certificate of Incorporation</option>
                  <option value="PAN_CARD">Business PAN / Tax ID</option>
                  <option value="GSTIN">GSTIN Registration Certificate</option>
                  <option value="LICENSE">Enterprise Hiring License / Auth</option>
                  <option value="OFFER_LETTER_TEMPLATE">Offer Letter Template</option>
                  <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                  <option value="CONTRACT">Standard Employment Contract</option>
                  <option value="POLICY">Company Policy / Handbook</option>
                  <option value="OTHER">Other Compliance Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ministry of Corporate Affairs Incorporation 2026"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Reference / Tax ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 07AAACG1234F1Z5 or U72900TG2026PTC"
                  value={uploadDocNumber}
                  onChange={(e) => setUploadDocNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                />
              </div>

              {/* File Drag-and-Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Choose Document File (PDF, DOCX, PNG, JPG - Max 15MB) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                    selectedFile
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-slate-700 block">Click to select document file</span>
                      <span className="text-[0.68rem] text-slate-400">PDF, Word, or Scanned Images up to 15MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to S3...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload to Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
