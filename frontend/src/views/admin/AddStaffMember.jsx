import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, CheckCircle2, AlertCircle, Shield,
  Mail, Lock, User, Briefcase, Eye, EyeOff,
  Users, Check, ArrowRight, Camera, Upload,
  Loader2, Search, Trash2, Plus, RefreshCw, X, Folder, FileCheck, Clock,
  Pencil, Phone, MapPin, Sparkles, ChevronDown, Layers, Building2, UserCheck, Tag, Filter
} from 'lucide-react';
import { api } from '../../api';

export default function AddStaffMember({ setActiveTab, initialView = 'form' }) {
  const [viewMode, setViewMode] = useState(initialView); // 'form' | 'directory' | 'groups'

  // Team Directory State
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'RECRUITER' | 'HIRING_MANAGER'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Staff Groups State
  const [staffGroups, setStaffGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState('ALL'); // 'ALL' | specific groupId
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupDeptFilter, setGroupDeptFilter] = useState('ALL');

  // Create / Edit Group Modal State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    department: '',
    description: '',
    member_ids: []
  });
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [groupRoleFilter, setGroupRoleFilter] = useState('ALL');

  // Quick Add Members to Group Modal State
  const [managingGroup, setManagingGroup] = useState(null);
  const [selectedAddMemberIds, setSelectedAddMemberIds] = useState([]);
  const [managingLoading, setManagingLoading] = useState(false);

  // Edit Staff Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'RECRUITER',
    title: '',
    phone: '',
    place: '',
    avatar_url: '',
    password: '',
    group_ids: []
  });
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [uploadingEditAvatar, setUploadingEditAvatar] = useState(false);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const editFileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECRUITER',
    title: '',
    avatar_url: '',
    group_ids: []
  });

  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const [staffDocs, setStaffDocs] = useState([]);

  // Fetch team members and groups on mount
  useEffect(() => {
    loadTeamMembers();
  }, []);

  // Sync viewMode when initialView prop changes from sidebar navigation
  useEffect(() => {
    if (initialView) {
      setViewMode(initialView);
    }
  }, [initialView]);

  const loadTeamMembers = async () => {
    setLoadingTeam(true);
    try {
      const [membersData, docsData, groupsData] = await Promise.all([
        api.getTeamMembers().catch(() => []),
        api.getStaffDocuments().catch(() => []),
        api.getStaffGroups ? api.getStaffGroups().catch(() => []) : Promise.resolve([])
      ]);
      setTeamMembers(membersData || []);
      setStaffDocs(docsData || []);
      setStaffGroups(groupsData || []);
    } catch (err) {
      console.error('Failed to load team members and groups:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size exceeds 5MB limit.');
      return;
    }

    setAvatarError('');
    setAvatarSuccess(false);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploadingAvatar(true);

    try {
      const res = await api.uploadStaffPhoto(file);
      if (res && res.avatar_url) {
        setFormData(prev => ({ ...prev, avatar_url: res.avatar_url }));
        setAvatarPreview(res.avatar_url);
        setAvatarSuccess(true);
      }
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload photo to S3. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    setAvatarPreview('');
    setAvatarSuccess(false);
    setAvatarError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.createTeamMember({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        title: formData.title.trim() || (formData.role === 'RECRUITER' ? 'Talent Specialist' : 'Department Manager'),
        avatar_url: formData.avatar_url || null,
        group_ids: formData.group_ids || []
      });

      setCreatedUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        title: formData.title || (formData.role === 'RECRUITER' ? 'Talent Specialist' : 'Department Manager'),
        avatar_url: formData.avatar_url || null,
        groups: res.member?.groups || []
      });
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'RECRUITER',
        title: '',
        avatar_url: '',
        group_ids: []
      });
      setAvatarPreview('');
      setAvatarSuccess(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload team & groups
      await loadTeamMembers();
    } catch (err) {
      setError(err.message || 'Failed to create team member account. Please verify the email is unique.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    setDeletingId(memberId);
    try {
      await api.deleteTeamMember(memberId);
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      setActionMessage(`Removed ${memberName} from team.`);
      setConfirmDeleteId(null);
      setTimeout(() => setActionMessage(''), 3500);
      await loadTeamMembers();
    } catch (err) {
      setActionMessage(`Error: ${err.message || 'Failed to delete member'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    const existingGroupIds = Array.isArray(member.groups) ? member.groups.map(g => g.id) : [];
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      role: member.role || 'RECRUITER',
      title: member.title || '',
      phone: member.phone || '',
      place: member.place || '',
      avatar_url: member.avatar_url || '',
      password: '',
      group_ids: existingGroupIds
    });
    setEditAvatarPreview(member.avatar_url || '');
    setEditError('');
    setShowEditPassword(false);
  };

  const handleEditAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image size exceeds 5MB limit.');
      return;
    }

    setEditError('');
    const localUrl = URL.createObjectURL(file);
    setEditAvatarPreview(localUrl);
    setUploadingEditAvatar(true);

    try {
      const res = await api.uploadStaffPhoto(file);
      if (res && res.avatar_url) {
        setEditFormData(prev => ({ ...prev, avatar_url: res.avatar_url }));
        setEditAvatarPreview(res.avatar_url);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to upload photo to S3.');
    } finally {
      setUploadingEditAvatar(false);
    }
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingMember) return;
    if (!editFormData.name.trim()) {
      setEditError('Staff member name is required.');
      return;
    }
    if (!editFormData.email.trim()) {
      setEditError('Staff member email is required.');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
        role: editFormData.role,
        title: editFormData.title.trim() || (editFormData.role === 'RECRUITER' ? 'Technical Recruiter' : 'Hiring Manager'),
        phone: editFormData.phone.trim() || null,
        place: editFormData.place.trim() || null,
        avatar_url: editFormData.avatar_url || null,
        group_ids: editFormData.group_ids || []
      };

      if (editFormData.password && editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      await api.updateTeamMember(editingMember.id, payload);
      setActionMessage(`Updated staff member "${payload.name}" successfully!`);
      setTimeout(() => setActionMessage(''), 4000);
      setEditingMember(null);
      await loadTeamMembers();
    } catch (err) {
      setEditError(err.message || 'Failed to update staff member.');
    } finally {
      setEditLoading(false);
    }
  };

  // Group CRUD Handlers
  const handleOpenCreateGroup = (initialMemberId = null) => {
    setEditingGroup(null);
    setGroupFormData({
      name: '',
      department: '',
      description: '',
      member_ids: initialMemberId ? [initialMemberId] : []
    });
    setGroupError('');
    setGroupMemberSearch('');
    setGroupRoleFilter('ALL');
    setShowGroupModal(true);
  };

  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name || '',
      department: group.department || '',
      description: group.description || '',
      member_ids: Array.isArray(group.members) ? group.members.map(m => m.id) : []
    });
    setGroupError('');
    setGroupMemberSearch('');
    setGroupRoleFilter('ALL');
    setShowGroupModal(true);
  };

  const handleSaveGroup = async (e) => {
    if (e) e.preventDefault();
    if (!groupFormData.name.trim()) {
      setGroupError('Please enter a group name.');
      return;
    }

    setGroupError('');
    setGroupLoading(true);

    const deptVal = groupFormData.department.trim() || 'General';

    try {
      if (editingGroup) {
        await api.updateStaffGroup(editingGroup.id, {
          name: groupFormData.name.trim(),
          department: deptVal,
          description: groupFormData.description.trim(),
          member_ids: groupFormData.member_ids
        });
        setActionMessage(`Updated group "${groupFormData.name.trim()}"`);
      } else {
        await api.createStaffGroup({
          name: groupFormData.name.trim(),
          department: deptVal,
          description: groupFormData.description.trim(),
          member_ids: groupFormData.member_ids
        });
        setActionMessage(`Created staff group "${groupFormData.name.trim()}" with ${groupFormData.member_ids.length} members!`);
      }
      setTimeout(() => setActionMessage(''), 4000);
      setShowGroupModal(false);
      await loadTeamMembers();
    } catch (err) {
      setGroupError(err.message || 'Failed to save staff group.');
    } finally {
      setGroupLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete group "${groupName}"? Staff member accounts will remain active.`)) return;
    try {
      await api.deleteStaffGroup(groupId);
      setActionMessage(`Removed group "${groupName}"`);
      setTimeout(() => setActionMessage(''), 3500);
      await loadTeamMembers();
    } catch (err) {
      setActionMessage(`Error: ${err.message || 'Failed to delete group'}`);
      setTimeout(() => setActionMessage(''), 3500);
    }
  };

  const handleRemoveMemberFromGroup = async (groupId, memberId, memberName, groupName) => {
    try {
      await api.removeStaffGroupMember(groupId, memberId);
      setActionMessage(`Removed ${memberName} from "${groupName}"`);
      setTimeout(() => setActionMessage(''), 3500);
      await loadTeamMembers();
    } catch (err) {
      setActionMessage(`Error: ${err.message || 'Failed to remove member'}`);
      setTimeout(() => setActionMessage(''), 3500);
    }
  };

  const handleOpenAddMembersToGroup = (group) => {
    setManagingGroup(group);
    setSelectedAddMemberIds([]);
  };

  const handleConfirmAddMembersToGroup = async () => {
    if (!managingGroup || selectedAddMemberIds.length === 0) return;
    setManagingLoading(true);
    try {
      await api.addStaffGroupMembers(managingGroup.id, selectedAddMemberIds);
      setActionMessage(`Added ${selectedAddMemberIds.length} member${selectedAddMemberIds.length > 1 ? 's' : ''} to "${managingGroup.name}"!`);
      setTimeout(() => setActionMessage(''), 4000);
      setManagingGroup(null);
      setSelectedAddMemberIds([]);
      await loadTeamMembers();
    } catch (err) {
      setActionMessage(`Error: ${err.message || 'Failed to add members'}`);
      setTimeout(() => setActionMessage(''), 3500);
    } finally {
      setManagingLoading(false);
    }
  };

  // Filtered members for Directory Table (Staff Directory is strictly for Recruiters & Hiring Managers)
  const staffMembers = teamMembers.filter(m => m.role !== 'ADMIN');
  const filteredMembers = staffMembers.filter(m => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    const matchesGroup = groupFilter === 'ALL' || (Array.isArray(m.groups) && m.groups.some(g => String(g.id) === String(groupFilter)));
    return matchesSearch && matchesRole && matchesGroup;
  });

  // Extract unique department names written by user
  const availableDepartments = Array.from(
    new Set(staffGroups.map(g => (g.department || '').trim()).filter(Boolean))
  ).sort();

  const filteredGroups = staffGroups.filter(grp => {
    const matchesSearch =
      (grp.name || '').toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
      (grp.description || '').toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
      (grp.department || '').toLowerCase().includes(groupSearchQuery.toLowerCase());
    const matchesDept = groupDeptFilter === 'ALL' || (grp.department || '').toLowerCase() === groupDeptFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  const allAssignedMemberIds = new Set();
  staffGroups.forEach(g => {
    if (Array.isArray(g.members)) {
      g.members.forEach(m => allAssignedMemberIds.add(m.id));
    }
  });

  const recruiterCount = staffMembers.filter(m => m.role === 'RECRUITER').length;
  const managerCount = staffMembers.filter(m => m.role === 'HIRING_MANAGER').length;

  return (
    <div className="min-h-full bg-[#F7F8FB] p-4 sm:p-6 lg:p-8 space-y-6 select-text">

      {/* ── Top Header & Tab Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {viewMode === 'directory' && 'Staff Directory'}
              {viewMode === 'groups' && 'Hiring Groups & Pods'}
              {viewMode === 'form' && 'Add Staff Member'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
              {viewMode === 'groups'
                ? `${staffGroups.length} ${staffGroups.length === 1 ? 'group' : 'groups'}`
                : `${staffMembers.length} ${staffMembers.length === 1 ? 'member' : 'members'}`
              }
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'directory' && 'Manage verified employee accounts, roles, access permissions, and KYC compliance records.'}
            {viewMode === 'groups' && 'Organize recruiters and hiring managers into functional hiring pods and department teams.'}
            {viewMode === 'form' && 'Provision dedicated agency accounts for Recruiters and Hiring Managers with custom permissions.'}
          </p>
        </div>

        {/* View Switcher Tabs (Only shown when viewing Staff Directory / Add Staff Member) */}
        {viewMode !== 'groups' && (
          <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => { setViewMode('directory'); setSuccess(false); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer flex items-center gap-2 ${
                viewMode === 'directory'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-700" />
              Staff Directory ({staffMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer flex items-center gap-2 ${
                viewMode === 'form'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#FF7043]" />
              + Add Staff Member
            </button>
          </div>
        )}
      </div>

      {/* Global Action Toast Notification */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage('')}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. STAFF DIRECTORY TABLE VIEW (SHOWS ALL EMPLOYEES)                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'directory' && (
        <div className="space-y-5 animate-in fade-in">

          {/* Quick Metrics Bar (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Staff
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{staffMembers.length}</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Recruiters
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{recruiterCount}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Sourcing
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hiring Managers
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{managerCount}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Evaluating
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hiring Groups / Pods
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-indigo-900">{staffGroups.length}</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff by name, email, designation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-slate-50/50"
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

            {/* Group Filter Dropdown, Role Filter Chips, & Actions */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
              {/* Group Filter Dropdown */}
              <div className="relative">
                <select
                  value={groupFilter}
                  onChange={e => setGroupFilter(e.target.value)}
                  className="pl-3 pr-8 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-slate-900 cursor-pointer appearance-none shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <option value="ALL">All Groups ({staffGroups.length})</option>
                  {staffGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.department})</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Role Filter Chips */}
              <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all ${
                    roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 bg-transparent hover:text-slate-900'
                  }`}
                >
                  All ({staffMembers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('RECRUITER')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all ${
                    roleFilter === 'RECRUITER' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 bg-transparent hover:text-slate-900'
                  }`}
                >
                  Recruiters ({recruiterCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('HIRING_MANAGER')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all ${
                    roleFilter === 'HIRING_MANAGER' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 bg-transparent hover:text-slate-900'
                  }`}
                >
                  Managers ({managerCount})
                </button>
              </div>

              <button
                type="button"
                onClick={loadTeamMembers}
                title="Refresh directory"
                className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTeam ? 'animate-spin text-[#FF7043]' : ''}`} />
              </button>


              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="px-3.5 py-2 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </button>
            </div>
          </div>

          {/* ── The Staff Directory Table ── */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {loadingTeam ? (
              <div className="p-16 text-center">
                <div className="w-7 h-7 border-2 border-slate-200 border-t-[#FF7043] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500">Loading staff directory...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {searchQuery || roleFilter !== 'ALL' || groupFilter !== 'ALL'
                    ? 'No matching staff members found'
                    : 'No staff members added yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  {searchQuery || roleFilter !== 'ALL' || groupFilter !== 'ALL'
                    ? 'Try adjusting your search keywords, role, or group filters.'
                    : 'Provision accounts for Recruiters to manage sourcing and Hiring Managers to evaluate applicants.'}
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold border-none cursor-pointer inline-flex items-center gap-2 shadow-[0_1px_2px_rgba(255,112,67,0.3)]"
                >
                  <Plus className="w-3.5 h-3.5" /> Provision First Staff Member
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Staff Member</th>
                      <th className="py-3.5 px-5">Assigned Role</th>
                      <th className="py-3.5 px-5">Hiring Groups / Pods</th>
                      <th className="py-3.5 px-5">Designation / Title</th>
                      <th className="py-3.5 px-5">Account Status</th>
                      <th className="py-3.5 px-5">KYC Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredMembers.map(member => {
                      const isRecruiter = member.role === 'RECRUITER';
                      const isConfirming = confirmDeleteId === member.id;
                      const isDeleting = deletingId === member.id;

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Member Photo & Identity */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                                  onError={e => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-2xs"
                                style={{
                                  background: isRecruiter ? '#2C4470' : '#7C5CBF',
                                  display: member.avatar_url ? 'none' : 'flex'
                                }}
                              >
                                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">
                                  {member.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                isRecruiter
                                  ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                  : 'bg-purple-50 text-purple-700 border-purple-200/80'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isRecruiter ? 'bg-blue-500' : 'bg-purple-500'
                                }`}
                              />
                              {isRecruiter ? 'Recruiter' : 'Hiring Manager'}
                            </span>
                          </td>

                          {/* Hiring Groups / Pods */}
                          <td className="py-4 px-5">
                            {Array.isArray(member.groups) && member.groups.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {member.groups.map(grp => (
                                  <button
                                    key={grp.id}
                                    type="button"
                                    onClick={() => setGroupFilter(String(grp.id))}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100 transition-colors cursor-pointer"
                                    title={`Filter by group: ${grp.name}`}
                                  >
                                    <Layers className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                    <span className="truncate max-w-[120px]">{grp.name}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400 italic">No pod assigned</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCreateGroup(member.id)}
                                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-1.5 py-0.5 rounded border-none cursor-pointer"
                                  title="Add to a group"
                                >
                                  + Assign
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Department / Title */}
                          <td className="py-4 px-5">
                            <div className="text-slate-800 font-medium text-xs flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {member.title || (isRecruiter ? 'Technical Recruiter' : 'Hiring Manager')}
                              </span>
                            </div>
                          </td>

                          {/* Account Status */}
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-emerald-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </td>

                          {/* KYC Status */}
                          <td className="py-4 px-5">
                            {(() => {
                              const memberDocs = staffDocs.filter(d => d.member_id === member.id);
                              const verifiedCount = memberDocs.filter(d => d.status === 'VERIFIED').length;
                              const pendingCount = memberDocs.filter(d => d.status === 'PENDING').length;
                              const isFullyVerified = memberDocs.length > 0 && verifiedCount === memberDocs.length;
                              const isPartiallyVerified = verifiedCount > 0 && pendingCount > 0;
                              const isPending = memberDocs.length > 0 && verifiedCount === 0;

                              if (isFullyVerified) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-emerald-200/80">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Verified ({verifiedCount})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab?.('staff_documents')}
                                      className="text-[11px] text-[#FF7043] font-semibold hover:underline border-none bg-transparent cursor-pointer"
                                      title="View KYC Documents"
                                    >
                                      View
                                    </button>
                                  </div>
                                );
                              }
                              if (isPartiallyVerified || isPending) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-200/80">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      {isPartiallyVerified ? 'Partial' : 'Review'} ({memberDocs.length})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab?.('staff_documents')}
                                      className="text-[11px] text-[#FF7043] font-semibold hover:underline border-none bg-transparent cursor-pointer"
                                      title="Review KYC Documents"
                                    >
                                      Review
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200">
                                    <AlertCircle className="w-3 h-3 text-slate-400" />
                                    No KYC Docs
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab?.('staff_documents')}
                                    className="text-[11px] font-semibold text-[#FF7043] hover:underline border-none bg-transparent cursor-pointer flex items-center gap-0.5"
                                    title="Upload KYC Document"
                                  >
                                    <Upload className="w-2.5 h-2.5" /> Upload
                                  </button>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Actions (Edit / Delete) */}
                          <td className="py-4 px-5 text-right">
                            {isConfirming ? (
                              <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                                <span className="text-[11px] font-semibold text-rose-700 px-1">
                                  Confirm?
                                </span>
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => handleDeleteMember(member.id, member.name)}
                                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors border-none cursor-pointer"
                                >
                                  {isDeleting ? 'Removing...' : 'Yes, Remove'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded-lg bg-white text-slate-600 text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(member)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                                  title={`Edit details for ${member.name}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(member.id)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                                  title={`Revoke access for ${member.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. HIRING GROUPS / PODS VIEW                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'groups' && (
        <div className="space-y-6 animate-in fade-in">

          {/* Quick Metrics Bar for Groups */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Active Hiring Pods
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{staffGroups.length}</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Assigned Staff in Pods
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{allAssignedMemberIds.size}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {staffMembers.length > 0 ? Math.round((allAssignedMemberIds.size / staffMembers.length) * 100) : 0}% of staff
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Unassigned Staff
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {staffMembers.filter(m => !allAssignedMemberIds.has(m.id)).length}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Available
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Staff Directory
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{staffMembers.length}</span>
                <button
                  type="button"
                  onClick={() => setViewMode('directory')}
                  className="text-xs font-bold text-[#FF7043] hover:underline border-none bg-transparent cursor-pointer"
                >
                  View All →
                </button>
              </div>
            </div>
          </div>

          {/* Groups Controls & Search Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search groups by name or description..."
                value={groupSearchQuery}
                onChange={e => setGroupSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all bg-slate-50/50"
              />
              {groupSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGroupSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter & Action Buttons */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
              {/* Department Dropdown (dynamically populated from user-written departments) */}
              {availableDepartments.length > 0 && (
                <div className="relative">
                  <select
                    value={groupDeptFilter}
                    onChange={e => setGroupDeptFilter(e.target.value)}
                    className="pl-3 pr-8 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-600 cursor-pointer appearance-none shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <option value="ALL">All Departments</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              <button
                type="button"
                onClick={loadTeamMembers}
                title="Refresh groups"
                className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTeam ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateGroup()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-[0_1px_2px_rgba(79,70,229,0.3)] flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Hiring Group</span>
              </button>
            </div>
          </div>

          {/* Group Cards Grid */}
          {filteredGroups.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                {groupSearchQuery || groupDeptFilter !== 'ALL'
                  ? 'No matching hiring groups found'
                  : 'No hiring groups created yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                {groupSearchQuery || groupDeptFilter !== 'ALL'
                  ? 'Try clearing your search query or department filter.'
                  : 'Create hiring pods with recruiters and hiring managers. Pod members can collaborate together on job postings, candidate evaluations, and interviews.'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateGroup()}
                className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold border-none cursor-pointer inline-flex items-center gap-2 shadow-[0_1px_2px_rgba(79,70,229,0.3)] transition-all"
              >
                <Plus className="w-4 h-4" /> Create First Hiring Pod
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredGroups.map(group => {
                const members = Array.isArray(group.members) ? group.members : [];
                const recruitersInGroup = members.filter(m => m.role === 'RECRUITER');
                const managersInGroup = members.filter(m => m.role === 'HIRING_MANAGER');

                return (
                  <div
                    key={group.id}
                    className="bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md transition-all flex flex-col overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                          <Building2 className="w-3 h-3 text-indigo-500" />
                          {group.department || 'General'}
                        </span>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGroup(group)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                            title="Edit Pod Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                            title="Delete Group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                        {group.description || 'Dedicated hiring pod collaborating on sourcing and candidate evaluations.'}
                      </p>
                    </div>

                    {/* Member Stats Pills */}
                    <div className="px-5 py-2.5 bg-slate-50/70 border-y border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {group.recruiter_count ?? recruitersInGroup.length} Recruiter{(group.recruiter_count ?? recruitersInGroup.length) === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          {group.manager_count ?? managersInGroup.length} Manager{(group.manager_count ?? managersInGroup.length) === 1 ? '' : 's'}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    {/* Pod Members List */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Assigned Members
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddMembersToGroup(group)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 border-none bg-transparent cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>

                        {members.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200 text-center">
                            <Users className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs text-slate-400 font-medium">No members added to this pod yet.</p>
                            <button
                              type="button"
                              onClick={() => handleOpenAddMembersToGroup(group)}
                              className="mt-2 text-xs font-semibold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                            >
                              + Assign Recruiters & Managers
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {members.map(m => {
                              const isRec = m.role === 'RECRUITER';
                              return (
                                <div
                                  key={m.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 hover:bg-slate-100/80 transition-colors border border-slate-100 group/member"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {m.avatar_url ? (
                                      <img
                                        src={m.avatar_url}
                                        alt={m.name}
                                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                                      />
                                    ) : (
                                      <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                                        style={{ background: isRec ? '#2C4470' : '#7C5CBF' }}
                                      >
                                        {m.name ? m.name.charAt(0).toUpperCase() : '?'}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-800 truncate">
                                        {m.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono truncate">
                                        {m.email}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        isRec
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                          : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                      }`}
                                    >
                                      {isRec ? 'Recruiter' : 'Manager'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMemberFromGroup(group.id, m.id, m.name, group.name)}
                                      className="w-5 h-5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center opacity-0 group-hover/member:opacity-100 transition-opacity border-none bg-transparent cursor-pointer"
                                      title={`Remove ${m.name} from ${group.name}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAddMembersToGroup(group)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors border-none cursor-pointer flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                          <span>+ Add Members</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGroupFilter(String(group.id));
                            setViewMode('directory');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1"
                        >
                          <span>Filter Staff</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Unassigned Staff Pool Section */}
          {(() => {
            const unassigned = staffMembers.filter(m => !allAssignedMemberIds.has(m.id));
            if (unassigned.length === 0) return null;

            return (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>Unassigned Staff Members ({unassigned.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      These recruiters and hiring managers have not been assigned to any hiring pod yet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateGroup()}
                    className="text-xs font-bold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                  >
                    + Create Group for Them
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {unassigned.map(m => {
                    const isRec = m.role === 'RECRUITER';
                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              alt={m.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ background: isRec ? '#2C4470' : '#7C5CBF' }}
                            >
                              {m.name ? m.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                                isRec ? 'text-blue-700 bg-blue-50' : 'text-purple-700 bg-purple-50'
                              }`}
                            >
                              {isRec ? 'Recruiter' : 'Manager'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenCreateGroup(m.id)}
                          className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
                        >
                          + Assign
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. ADD STAFF MEMBER FORM VIEW                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'form' && (
        <div className="space-y-6 animate-in fade-in">

          {/* Success Notification Banner */}
          {success && createdUser && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                {createdUser.avatar_url ? (
                  <img
                    src={createdUser.avatar_url}
                    alt={createdUser.name}
                    className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-emerald-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Staff Account Successfully Created!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    <strong>{createdUser.name}</strong> has been provisioned as a <strong>{createdUser.role.replace('_', ' ')}</strong> ({createdUser.email}).
                    {createdUser.avatar_url && (
                      <span className="block text-[11px] text-emerald-600 mt-0.5 font-semibold">
                        ✓ Profile photo securely saved to AWS S3.
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition-colors border border-emerald-200 cursor-pointer"
                >
                  Add Another Member
                </button>
                <button
                  type="button"
                  onClick={() => { setViewMode('directory'); setSuccess(false); }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors border-none cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  View in Directory Table →
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ── Left Column: Form ── */}
            <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6">

              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Employee Credentials & Role
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up user access, assign platform capabilities, and upload identity credentials.
                </p>
              </div>

              {/* Select Role (Interactive Cards) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Platform Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'RECRUITER' })}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                      formData.role === 'RECRUITER'
                        ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                      formData.role === 'RECRUITER' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {formData.role === 'RECRUITER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Recruiter</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold">Sourcing</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-1">
                        Post job openings, review candidate pipelines, and manage recruiter messaging.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'HIRING_MANAGER' })}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                      formData.role === 'HIRING_MANAGER'
                        ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                      formData.role === 'HIRING_MANAGER' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                    }`}>
                      {formData.role === 'HIRING_MANAGER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Hiring Manager</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-semibold">Evaluation</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-1">
                        Review shortlisted talent, conduct interviews, and submit hiring scorecard evaluations.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Profile Photo / Avatar (AWS S3) */}
              <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Staff Profile Photo <span className="text-slate-400 font-normal">(Uploaded directly to AWS S3)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Avatar Circle Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-18 h-18 rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-white shadow-2xs relative">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Staff Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <User className="w-8 h-8 text-slate-300" />
                        </div>
                      )}

                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-bold">
                          <Loader2 className="w-4 h-4 animate-spin mb-1 text-slate-200" />
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-all disabled:opacity-50"
                      title="Choose photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Upload Controls & S3 Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        {formData.avatar_url ? 'Change Photo' : 'Upload Photo'}
                      </button>

                      {formData.avatar_url && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors border-none bg-transparent cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2">
                      JPG, PNG, or WebP up to 5MB. Photo will be saved to your AWS S3 bucket.
                    </p>

                    {avatarSuccess && formData.avatar_url && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Photo uploaded successfully!</span>
                      </div>
                    )}

                    {avatarError && (
                      <div className="mt-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{avatarError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                {/* Official Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Official Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. sarah@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    The member will use this email address to log in to their dashboard.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Set initial secure password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Title (Optional)</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={formData.role === 'RECRUITER' ? 'e.g. Senior Talent Partner' : 'e.g. VP of Product Engineering'}
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Assign to Hiring Pod / Group (Optional) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="mb-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Assign to Hiring Pod / Group (Optional)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Organize this member into an active recruitment team pod.
                    </p>
                  </div>

                  {staffGroups.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                      <span>No groups created yet. You can create and manage hiring groups from the Hiring Groups section in the sidebar.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                      {staffGroups.map(grp => {
                        const isSelected = formData.group_ids.includes(grp.id);
                        return (
                          <label
                            key={grp.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-300/40'
                                : 'bg-white border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({ ...prev, group_ids: [...prev.group_ids, grp.id] }));
                                  } else {
                                    setFormData(prev => ({ ...prev, group_ids: prev.group_ids.filter(id => id !== grp.id) }));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate">{grp.name}</div>
                                <div className="text-[10px] text-slate-400">{grp.department} • {grp.member_count || (grp.members ? grp.members.length : 0)} members</div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-3 h-3 text-indigo-600 shrink-0" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Form Submit & Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewMode('directory')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingAvatar || !formData.name || !formData.email || !formData.password}
                  className="px-6 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-2 border-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Provisioning Account...
                    </>
                  ) : (
                    <>Create Staff Account <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

            </form>

            {/* ── Right Column: Live Card Preview & Info ── */}
            <div className="lg:col-span-4 space-y-4">

              {/* Live Preview Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Live Member Preview
                </span>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {formData.name || 'Member Name'}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formData.title || (formData.role === 'RECRUITER' ? 'Senior Talent Partner' : 'Department Manager')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Assigned Role</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        formData.role === 'RECRUITER'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                          : 'bg-purple-50 text-purple-700 border border-purple-200/80'
                      }`}>
                        {formData.role.replace('_', ' ')}
                      </span>
                    </div>

                    {formData.group_ids && formData.group_ids.length > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Hiring Pods</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                          {formData.group_ids.map(gid => {
                            const g = staffGroups.find(x => x.id === gid);
                            return g ? (
                              <span key={gid} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                {g.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Login Email</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {formData.email || 'email@company.com'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Cloud Photo</span>
                      <span className="font-semibold text-[11px]">
                        {formData.avatar_url ? (
                          <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> S3 Saved
                          </span>
                        ) : (
                          <span className="text-slate-400">Default Avatar</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Status</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Permissions Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {formData.role === 'RECRUITER' ? 'Recruiter Permissions' : 'Hiring Manager Permissions'}
                </span>
                <div className="space-y-2 text-xs">
                  {formData.role === 'RECRUITER' ? (
                    <>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>Create, publish, and manage job postings</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>Review candidate pipeline & source talent</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>Schedule and coordinate interviews</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>Communicate via team messages</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>Evaluate shortlisted applicants for department</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>Submit candidate feedback & interview scores</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>Participate in live interview rounds</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>Approve or decline final hiring proposals</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AWS S3 & Security Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enterprise Security Isolation</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Accounts are provisioned with role-based access control. Profile media is encrypted and hosted securely via AWS S3.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. EDIT STAFF MEMBER MODAL                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Staff Member</h3>
                  <p className="text-[11px] text-slate-500">Update account credentials, designation, and role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Avatar Uploader Section */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-2xs bg-slate-200 flex items-center justify-center">
                    {editAvatarPreview ? (
                      <img src={editAvatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-slate-500">
                        {editFormData.name ? editFormData.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                  {uploadingEditAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800">Profile Photo</div>
                  <div className="text-[11px] text-slate-500 mb-2">Upload a professional headshot (JPG, PNG, WebP up to 5MB)</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingEditAvatar}
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-600" />
                      {uploadingEditAvatar ? 'Uploading...' : 'Change Photo'}
                    </button>
                    {editFormData.avatar_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData(prev => ({ ...prev, avatar_url: '' }));
                          setEditAvatarPreview('');
                        }}
                        className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold border-none bg-transparent cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleEditAvatarSelect}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-800"
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-800"
                    placeholder="staff@company.com"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Platform Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditFormData({
                      ...editFormData,
                      role: 'RECRUITER',
                      title: editFormData.title && editFormData.title !== 'Hiring Manager' ? editFormData.title : 'Technical Recruiter'
                    })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      editFormData.role === 'RECRUITER'
                        ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                      editFormData.role === 'RECRUITER' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {editFormData.role === 'RECRUITER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Recruiter</div>
                      <div className="text-[11px] text-slate-500 leading-tight">Post jobs & screen applicants</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditFormData({
                      ...editFormData,
                      role: 'HIRING_MANAGER',
                      title: editFormData.title && editFormData.title !== 'Technical Recruiter' ? editFormData.title : 'Hiring Manager'
                    })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      editFormData.role === 'HIRING_MANAGER'
                        ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-400/20'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                      editFormData.role === 'HIRING_MANAGER' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                    }`}>
                      {editFormData.role === 'HIRING_MANAGER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Hiring Manager</div>
                      <div className="text-[11px] text-slate-500 leading-tight">Conduct interviews & evaluations</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Designation / Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Designation / Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-800"
                    placeholder="e.g. Senior Technical Recruiter"
                  />
                </div>
              </div>

              {/* Phone & Place (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-800"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Location / Place (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editFormData.place}
                      onChange={e => setEditFormData({ ...editFormData, place: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-800"
                      placeholder="e.g. New York, NY / Remote"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Password (Optional) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reset Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editFormData.password}
                    onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-800"
                    placeholder="Leave blank to keep existing password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Only fill this in if you want to assign a new password to this staff member.
                </span>
              </div>

              {/* Assigned Groups / Pods */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Hiring Pods / Groups
                </label>
                {staffGroups.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No hiring groups created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200/80 rounded-xl bg-slate-50/50">
                    {staffGroups.map(grp => {
                      const isSelected = Array.isArray(editFormData.group_ids) && editFormData.group_ids.includes(grp.id);
                      return (
                        <label
                          key={grp.id}
                          className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditFormData(prev => ({ ...prev, group_ids: [...(prev.group_ids || []), grp.id] }));
                                } else {
                                  setEditFormData(prev => ({ ...prev, group_ids: (prev.group_ids || []).filter(id => id !== grp.id) }));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{grp.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{grp.department}</div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200/80 bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#FF7043] hover:bg-[#E65B30] border-none cursor-pointer flex items-center gap-2 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-colors disabled:opacity-50"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. CREATE / EDIT HIRING GROUP MODAL                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingGroup ? 'Edit Hiring Pod / Group' : 'Create New Hiring Pod / Group'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Organize Recruiters and Hiring Managers into a collaborative pod
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGroup} className="p-6 space-y-4 overflow-y-auto flex-1">
              {groupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{groupError}</span>
                </div>
              )}

              {/* Group Name & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Pod / Group Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Core Engineering Pod"
                    value={groupFormData.name}
                    onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Department Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Sales, Digital Marketing..."
                    value={groupFormData.department}
                    onChange={e => setGroupFormData({ ...groupFormData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pod Purpose / Description (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Responsible for full-lifecycle hiring across backend, frontend, and DevOps positions."
                  value={groupFormData.description}
                  onChange={e => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-900 bg-white resize-none"
                />
              </div>

              {/* Members Multi-select Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Assign Pod Members
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {groupFormData.member_ids.length} selected
                      {(() => {
                        const selRecs = staffMembers.filter(m => groupFormData.member_ids.includes(m.id) && m.role === 'RECRUITER').length;
                        const selMgrs = staffMembers.filter(m => groupFormData.member_ids.includes(m.id) && m.role === 'HIRING_MANAGER').length;
                        return ` (${selRecs} Recruiters, ${selMgrs} Hiring Managers)`;
                      })()}
                    </span>
                  </div>

                  {/* Role filter buttons */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setGroupRoleFilter('ALL')}
                      className={`px-2 py-0.5 rounded-md border-none cursor-pointer ${groupRoleFilter === 'ALL' ? 'bg-white shadow-2xs text-slate-800' : 'text-slate-500 bg-transparent'}`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupRoleFilter('RECRUITER')}
                      className={`px-2 py-0.5 rounded-md border-none cursor-pointer ${groupRoleFilter === 'RECRUITER' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 bg-transparent'}`}
                    >
                      Recruiters
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupRoleFilter('HIRING_MANAGER')}
                      className={`px-2 py-0.5 rounded-md border-none cursor-pointer ${groupRoleFilter === 'HIRING_MANAGER' ? 'bg-white shadow-2xs text-purple-700' : 'text-slate-500 bg-transparent'}`}
                    >
                      Managers
                    </button>
                  </div>
                </div>

                {/* Member Search input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search staff to assign..."
                    value={groupMemberSearch}
                    onChange={e => setGroupMemberSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Members list */}
                {staffMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No staff members in directory yet.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                    {staffMembers
                      .filter(m => {
                        const matchesRole = groupRoleFilter === 'ALL' || m.role === groupRoleFilter;
                        const matchesText =
                          (m.name || '').toLowerCase().includes(groupMemberSearch.toLowerCase()) ||
                          (m.email || '').toLowerCase().includes(groupMemberSearch.toLowerCase());
                        return matchesRole && matchesText;
                      })
                      .map(m => {
                        const isSelected = groupFormData.member_ids.includes(m.id);
                        const isRec = m.role === 'RECRUITER';

                        return (
                          <label
                            key={m.id}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-300/40'
                                : 'bg-white border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupFormData(prev => ({ ...prev, member_ids: [...prev.member_ids, m.id] }));
                                  } else {
                                    setGroupFormData(prev => ({ ...prev, member_ids: prev.member_ids.filter(id => id !== m.id) }));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              {m.avatar_url ? (
                                <img
                                  src={m.avatar_url}
                                  alt={m.name}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                                  style={{ background: isRec ? '#2C4470' : '#7C5CBF' }}
                                >
                                  {m.name ? m.name.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{m.email}</div>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isRec ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                              }`}
                            >
                              {isRec ? 'Recruiter' : 'Manager'}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200/80 bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={groupLoading || !groupFormData.name.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 border-none cursor-pointer flex items-center gap-2 shadow-[0_1px_2px_rgba(79,70,229,0.3)] transition-colors disabled:opacity-50"
                >
                  {groupLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {editingGroup ? 'Save Pod Changes' : 'Create Pod'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. QUICK ADD MEMBERS TO GROUP MODAL                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {managingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    Add Members to "{managingGroup.name}"
                  </h3>
                  <p className="text-[11px] text-slate-500">Department: {managingGroup.department}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingGroup(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500">
                Select recruiters and hiring managers to add to this pod:
              </p>

              {(() => {
                const currentMemberIds = Array.isArray(managingGroup.members) ? managingGroup.members.map(m => m.id) : [];
                const availableToAdd = staffMembers.filter(m => !currentMemberIds.includes(m.id));

                if (availableToAdd.length === 0) {
                  return (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <UserCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">All staff members are already in this pod!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Provision new staff members in the directory first.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {availableToAdd.map(m => {
                      const isSelected = selectedAddMemberIds.includes(m.id);
                      const isRec = m.role === 'RECRUITER';

                      return (
                        <label
                          key={m.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300/40'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAddMemberIds(prev => [...prev, m.id]);
                                } else {
                                  setSelectedAddMemberIds(prev => prev.filter(id => id !== m.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">{m.email}</div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isRec ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            }`}
                          >
                            {isRec ? 'Recruiter' : 'Manager'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
              <span className="text-xs text-slate-500 font-medium">
                {selectedAddMemberIds.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManagingGroup(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 border border-slate-200/80 bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={managingLoading || selectedAddMemberIds.length === 0}
                  onClick={handleConfirmAddMembersToGroup}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 border-none cursor-pointer flex items-center gap-1.5 shadow-[0_1px_2px_rgba(79,70,229,0.3)] transition-colors disabled:opacity-40"
                >
                  {managingLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Add to Pod
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
