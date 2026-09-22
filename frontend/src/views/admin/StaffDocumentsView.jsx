import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, FileText, CheckCircle2, AlertCircle, Clock,
  Upload, Search, Filter, Plus, Trash2, ExternalLink,
  ShieldCheck, User, Users, Download, X, Eye, FileCheck,
  Building2, Briefcase, FileBadge, Check, ChevronRight, Loader2
} from 'lucide-react';
import { api } from '../../api';

export default function StaffDocumentsView({ setActiveTab }) {
  const [documents, setDocuments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    member_id: '',
    doc_type: 'NATIONAL_ID',
    doc_name: '',
    doc_number: '',
    status: 'VERIFIED',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Status Change / Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, membersData] = await Promise.all([
        api.getStaffDocuments().catch(() => []),
        api.getTeamMembers().catch(() => [])
      ]);
      setDocuments(docsData || []);
      setTeamMembers(membersData || []);

      // Default first member in upload form if available
      if (membersData && membersData.length > 0 && !uploadFormData.member_id) {
        setUploadFormData(prev => ({ ...prev, member_id: String(membersData[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load staff documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
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
    if (!uploadFormData.doc_name) {
      // Auto-populate document name from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadFormData(prev => ({
        ...prev,
        doc_name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!uploadFormData.member_id) {
      setUploadError('Please select a staff member.');
      return;
    }
    if (!selectedFile) {
      setUploadError('Please select a document file to upload.');
      return;
    }
    if (!uploadFormData.doc_name.trim()) {
      setUploadError('Please enter a document title or description.');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('member_id', uploadFormData.member_id);
      form.append('doc_type', uploadFormData.doc_type);
      form.append('doc_name', uploadFormData.doc_name.trim());
      if (uploadFormData.doc_number) {
        form.append('doc_number', uploadFormData.doc_number.trim());
      }
      form.append('status', uploadFormData.status);
      if (uploadFormData.notes) {
        form.append('notes', uploadFormData.notes.trim());
      }
      form.append('file', selectedFile);

      const res = await api.uploadStaffDocument(form);
      showToast(`✨ KYC Document uploaded to AWS S3 for ${res?.document?.member_name || 'staff member'}!`);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadFormData({
        member_id: teamMembers[0]?.id ? String(teamMembers[0].id) : '',
        doc_type: 'NATIONAL_ID',
        doc_name: '',
        doc_number: '',
        status: 'VERIFIED',
        notes: ''
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload staff document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (docId, newStatus) => {
    try {
      await api.updateStaffDocumentStatus(docId, newStatus);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
      showToast(`Document status updated to ${newStatus}`);
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to update status'}`);
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    setDeletingId(docId);
    try {
      await api.deleteStaffDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      showToast(`Removed '${docName}' from staff documents.`);
      setConfirmDeleteId(null);
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to delete document'}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      (doc.doc_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.member_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.doc_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.file_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMember = selectedMemberFilter === 'ALL' || String(doc.member_id) === String(selectedMemberFilter);
    const matchesType = selectedTypeFilter === 'ALL' || doc.doc_type === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || doc.status === selectedStatusFilter;

    return matchesSearch && matchesMember && matchesType && matchesStatus;
  });

  // Derived metrics
  const totalDocs = documents.length;
  const verifiedDocs = documents.filter(d => d.status === 'VERIFIED').length;
  const pendingDocs = documents.filter(d => d.status === 'PENDING').length;

  // Staff members with at least one verified document
  const verifiedMemberIds = new Set(documents.filter(d => d.status === 'VERIFIED').map(d => d.member_id));
  const verifiedStaffCount = verifiedMemberIds.size;

  const docTypeLabels = {
    NATIONAL_ID: 'Government / National ID',
    PASSPORT: 'Passport',
    PAN_CARD: 'PAN / Tax ID',
    AADHAAR: 'Aadhaar Card',
    CONTRACT: 'Employment Contract',
    ADDRESS_PROOF: 'Proof of Address',
    CERTIFICATE: 'Certification / Degree',
    OTHER: 'Other Document'
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'NATIONAL_ID':
      case 'AADHAAR':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'PASSPORT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      case 'PAN_CARD':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'CONTRACT':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'ADDRESS_PROOF':
        return 'bg-teal-50 text-teal-700 border-teal-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-10xl mx-auto space-y-6 select-text">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </span>
            Staff KYC & Compliance Documents
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload, verify, and manage official identity verification (KYC), contracts, and compliance records for agency staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab?.('add_staff')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all bg-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Staff Directory
          </button>

          <button
            type="button"
            onClick={() => { setShowUploadModal(true); setUploadError(''); }}
            className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload KYC Document
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Quick Metrics Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total KYC Documents
          </span>
          <div className="text-xl font-black text-slate-900 flex items-center justify-between">
            <span>{totalDocs}</span>
            <Folder className="w-5 h-5 text-slate-300" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Verified Documents
          </span>
          <div className="text-xl font-black text-emerald-700 flex items-center justify-between">
            <span>{verifiedDocs}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-500 block mb-1">
            Pending Review
          </span>
          <div className="text-xl font-black text-amber-700 flex items-center justify-between">
            <span>{pendingDocs}</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-blue-600 block mb-1">
            Staff Verified
          </span>
          <div className="text-xl font-black text-blue-700 flex items-center justify-between">
            <span>{verifiedStaffCount} / {teamMembers.length}</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* ── Staff Member KYC Status Overview (TABLE FORM) ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
                <Users className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Staff Member KYC Status Overview
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                {teamMembers.length} Staff {teamMembers.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>
            <p className="text-[0.68rem] text-slate-400 mt-1">
              Table overview of identity verification (KYC), compliance documents, and verification progress by employee.
            </p>
          </div>
          {selectedMemberFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedMemberFilter('ALL')}
              className="text-xs font-bold text-[#00a884] hover:underline border-none bg-transparent cursor-pointer"
            >
              Clear Member Filter (Showing All)
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Designation</th>
                <th className="py-3.5 px-5">KYC Documents</th>
                <th className="py-3.5 px-5">Verification Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#00a884]" />
                    Loading staff KYC overview...
                  </td>
                </tr>
              ) : teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <p className="font-bold text-slate-600 text-xs">No staff members found</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab?.('add_staff')}
                      className="mt-2 text-xs font-bold text-[#00a884] hover:underline border-none bg-transparent cursor-pointer"
                    >
                      + Add Staff Member
                    </button>
                  </td>
                </tr>
              ) : (
                teamMembers.map(member => {
                  const memberDocs = documents.filter(d => d.member_id === member.id);
                  const verifiedCount = memberDocs.filter(d => d.status === 'VERIFIED').length;
                  const pendingCount = memberDocs.filter(d => d.status === 'PENDING').length;
                  const isFullyVerified = memberDocs.length > 0 && verifiedCount === memberDocs.length;
                  const isPartiallyVerified = verifiedCount > 0 && pendingCount > 0;
                  const isPending = memberDocs.length > 0 && verifiedCount === 0;
                  const isSelected = String(selectedMemberFilter) === String(member.id);

                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isSelected ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      {/* Staff Member */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                              onError={e => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-2xs"
                            style={{
                              background: member.role === 'RECRUITER' ? '#2C4470' : '#7C5CBF',
                              display: member.avatar_url ? 'none' : 'flex'
                            }}
                          >
                            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate">
                              {member.name}
                            </div>
                            <div className="text-[0.68rem] text-slate-500 font-mono truncate">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-extrabold border ${
                            member.role === 'RECRUITER'
                              ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                              : 'bg-purple-50 text-purple-700 border-purple-200/80'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.role === 'RECRUITER' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}
                          />
                          {member.role === 'RECRUITER' ? 'Recruiter' : 'Hiring Manager'}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="py-3.5 px-5 text-slate-700 font-bold">
                        {member.title || (member.role === 'RECRUITER' ? 'Technical Recruiter' : 'Hiring Manager')}
                      </td>

                      {/* Documents Uploaded */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {memberDocs.length} {memberDocs.length === 1 ? 'document' : 'documents'}
                          </span>
                          {memberDocs.length > 0 && (
                            <span className="text-[0.68rem] text-slate-400">
                              ({verifiedCount} verified{pendingCount > 0 ? `, ${pendingCount} pending` : ''})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* KYC Status */}
                      <td className="py-3.5 px-5">
                        {isFullyVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[0.68rem] font-bold border border-emerald-200/80">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : isPartiallyVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[0.68rem] font-bold border border-amber-200/80">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Partially Verified
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[0.68rem] font-bold border border-amber-200/80">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Under Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-[0.68rem] font-bold border border-slate-200">
                            <AlertCircle className="w-3 h-3 text-slate-400" />
                            No KYC Docs
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadFormData(prev => ({ ...prev, member_id: String(member.id) }));
                              setShowUploadModal(true);
                              setUploadError('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[0.7rem] font-bold transition-colors border-none cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Upload KYC document for this member"
                          >
                            <Plus className="w-3 h-3" />
                            Upload KYC
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedMemberFilter(isSelected ? 'ALL' : String(member.id))}
                            className={`px-2.5 py-1 rounded-lg text-[0.7rem] font-bold transition-colors border cursor-pointer ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected ? 'Viewing Docs' : 'Filter Docs'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by doc title, staff name, ID number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-slate-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {/* Member Filter Dropdown */}
          <select
            value={selectedMemberFilter}
            onChange={e => setSelectedMemberFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Staff Members ({teamMembers.length})</option>
            {teamMembers.map(m => (
              <option key={m.id} value={String(m.id)}>
                {m.name} ({m.role.replace('_', ' ')})
              </option>
            ))}
          </select>

          {/* Document Type Dropdown */}
          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Document Types</option>
            <option value="NATIONAL_ID">National ID / Aadhaar</option>
            <option value="PASSPORT">Passport</option>
            <option value="PAN_CARD">PAN / Tax ID</option>
            <option value="CONTRACT">Employment Contract</option>
            <option value="ADDRESS_PROOF">Proof of Address</option>
            <option value="CERTIFICATE">Certifications</option>
            <option value="OTHER">Other Documents</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            title="Refresh documents"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer bg-white"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Documents Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-[#00a884] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading staff KYC documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center mx-auto mb-3">
              <Folder className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">
              {searchQuery || selectedMemberFilter !== 'ALL' || selectedTypeFilter !== 'ALL'
                ? 'No matching staff documents found'
                : 'No staff KYC documents uploaded yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery || selectedMemberFilter !== 'ALL' || selectedTypeFilter !== 'ALL'
                ? 'Try adjusting your search terms or filters.'
                : 'Upload Aadhaar, Passport, PAN cards, or Employment Agreements to verify your staff members.'}
            </p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold border-none cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Upload First KYC Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-5">Document Title & Type</th>
                  <th className="py-3.5 px-5">Document ID / Number</th>
                  <th className="py-3.5 px-5">File & Storage</th>
                  <th className="py-3.5 px-5">KYC Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredDocs.map(doc => {
                  const isConfirming = confirmDeleteId === doc.id;
                  const isDeleting = deletingId === doc.id;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Staff Member */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {doc.member_avatar ? (
                            <img
                              src={doc.member_avatar}
                              alt={doc.member_name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                              style={{ background: doc.member_role === 'RECRUITER' ? '#2C4470' : '#7C5CBF' }}
                            >
                              {doc.member_name ? doc.member_name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate">
                              {doc.member_name}
                            </div>
                            <div className="text-[0.68rem] text-slate-400">
                              {doc.member_title || doc.member_role.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Document Details & Type */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{doc.doc_name}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[0.62rem] font-extrabold border ${getDocTypeBadge(doc.doc_type)}`}>
                            {docTypeLabels[doc.doc_type] || doc.doc_type}
                          </span>
                        </div>
                      </td>

                      {/* Document ID Number */}
                      <td className="py-4 px-5">
                        {doc.doc_number ? (
                          <span className="font-mono text-[0.72rem] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                            {doc.doc_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[0.7rem] italic">None specified</span>
                        )}
                      </td>

                      {/* File Details & AWS S3 link */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors no-underline shadow-2xs"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                            <span>View / Download</span>
                          </a>
                          <span className="text-[0.65rem] text-slate-400 font-semibold">
                            {doc.file_size || 'S3 File'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.68rem] font-extrabold border ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : doc.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}>
                            {doc.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {doc.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                            {doc.status === 'REJECTED' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                            {doc.status}
                          </span>

                          {/* Quick Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(doc.id, doc.status === 'VERIFIED' ? 'PENDING' : 'VERIFIED')}
                            className="text-[0.65rem] text-slate-400 hover:text-slate-700 underline border-none bg-transparent cursor-pointer p-0"
                            title="Toggle verification status"
                          >
                            {doc.status === 'VERIFIED' ? 'Mark Pending' : 'Mark Verified'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                            <span className="text-[0.68rem] font-bold text-rose-700 px-1">
                              Delete?
                            </span>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteDocument(doc.id, doc.doc_name)}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[0.68rem] font-bold transition-colors border-none cursor-pointer"
                            >
                              {isDeleting ? '...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-white text-slate-600 text-[0.68rem] font-bold border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(doc.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                            title={`Delete ${doc.doc_name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* UPLOAD STAFF KYC DOCUMENT MODAL                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Upload Staff KYC Document
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Stream documents directly into AWS S3 storage
                  </p>
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

            {/* Upload Error Alert */}
            {uploadError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
              {/* Select Staff Member */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Staff Member *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    value={uploadFormData.member_id}
                    onChange={e => setUploadFormData({ ...uploadFormData, member_id: e.target.value })}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="" disabled>Select staff member</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={String(m.id)}>
                        {m.name} ({m.role.replace('_', ' ')}) — {m.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  KYC Document Type *
                </label>
                <select
                  required
                  value={uploadFormData.doc_type}
                  onChange={e => setUploadFormData({ ...uploadFormData, doc_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer"
                >
                  <option value="NATIONAL_ID">National Government ID / Aadhaar Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="PAN_CARD">PAN Card / Tax Identification</option>
                  <option value="CONTRACT">Signed Employment Agreement / Offer Letter</option>
                  <option value="ADDRESS_PROOF">Proof of Address (Utility / Bank Statement)</option>
                  <option value="CERTIFICATE">Academic / Professional Certificate</option>
                  <option value="OTHER">Other Compliance Document</option>
                </select>
              </div>

              {/* Document Name / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhaar Card (Front & Back)"
                  value={uploadFormData.doc_name}
                  onChange={e => setUploadFormData({ ...uploadFormData, doc_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Document Identification Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document ID Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4829-1920-3849 or PAN: ABCDE1234F"
                  value={uploadFormData.doc_number}
                  onChange={e => setUploadFormData({ ...uploadFormData, doc_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* File Drag & Drop Upload Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document File (PDF, PNG, JPG, WebP) *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-slate-200 hover:border-[#00a884] rounded-2xl text-center cursor-pointer transition-colors bg-slate-50/60 group"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[0.68rem] text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for AWS S3
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#00a884] group-hover:underline">
                        Change
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-[#00a884] transition-colors" />
                      <p className="text-xs font-bold text-slate-800">
                        Click or drag document to upload
                      </p>
                      <p className="text-[0.68rem] text-slate-400 mt-1">
                        Supported: PDF, JPG, PNG, WebP (Max 15MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Initial Verification Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Verification Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadFormData({ ...uploadFormData, status: 'VERIFIED' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      uploadFormData.status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified & Approved
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadFormData({ ...uploadFormData, status: 'PENDING' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      uploadFormData.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Under Review
                  </button>
                </div>
              </div>

              {/* Notes / Internal Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Compliance / Verification Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Identity verified on UIDAI portal by Administrator"
                  value={uploadFormData.notes}
                  onChange={e => setUploadFormData({ ...uploadFormData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile || !uploadFormData.member_id}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 border-none cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                      Uploading to S3...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Save KYC Document
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
