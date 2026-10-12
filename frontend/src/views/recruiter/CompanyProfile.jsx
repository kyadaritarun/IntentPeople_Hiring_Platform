import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Globe, Phone, MapPin, Save, ShieldCheck,
  CheckCircle2, Edit3, Camera, Share2, ExternalLink,
  Users, Plus, Briefcase, X, Eye, TrendingUp, Sparkles,
  ArrowUpRight, Award, Zap, Check, Clock, Layers, ChevronRight,
  Upload, Loader2, RefreshCw, AlertCircle, Trash2, User, Mail,
  FileText, Target, Linkedin, Calendar, MapPinned, Compass,
  DollarSign, BarChart3, HelpCircle, HeartHandshake, Laptop, BookOpen, FileCheck, Lock
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import ToastNotification from '../../components/ToastNotification';
import RevenueModelHelpTooltip from '../../components/RevenueModelHelpTooltip';
import { INDIA_STATES_AND_CITIES, INDIAN_STATES } from '../../utils/indiaLocations';

const parseInitialHq = (rawLocation) => {
  if (!rawLocation) return { state: '', city: '', isCustom: false };
  const loc = rawLocation.trim().toLowerCase();
  
  if (loc === 'hyd' || loc.includes('hyderabad')) {
    return { state: 'Telangana', city: 'Hyderabad', isCustom: false };
  }
  if (loc === 'blr' || loc.includes('bangalore') || loc.includes('bengaluru')) {
    return { state: 'Karnataka', city: 'Bengaluru (Bangalore)', isCustom: false };
  }
  if (loc === 'mum' || loc.includes('mumbai') || loc.includes('bombay')) {
    return { state: 'Maharashtra', city: 'Mumbai', isCustom: false };
  }
  if (loc.includes('pune')) {
    return { state: 'Maharashtra', city: 'Pune', isCustom: false };
  }
  if (loc.includes('delhi') || loc.includes('noida') || loc.includes('gurgaon') || loc.includes('gurugram')) {
    const city = loc.includes('noida') ? 'Noida' : (loc.includes('gur') ? 'Gurugram (Gurgaon)' : 'New Delhi');
    return { state: 'Delhi (NCR)', city, isCustom: false };
  }
  if (loc.includes('chennai') || loc.includes('madras')) {
    return { state: 'Tamil Nadu', city: 'Chennai', isCustom: false };
  }
  if (loc.includes('kolkata') || loc.includes('calcutta')) {
    return { state: 'West Bengal', city: 'Kolkata', isCustom: false };
  }

  for (const [st, cities] of Object.entries(INDIA_STATES_AND_CITIES)) {
    for (const ct of cities) {
      if (loc.includes(ct.toLowerCase())) {
        return { state: st, city: ct, isCustom: false };
      }
    }
  }

  return { state: '', city: '', isCustom: true };
};

// ── Preset Option Lists Matching User Blueprint ──────────────────────────────
const ORGANISATION_TYPES = [
  'Direct employer',
  'Recruitment agency',
  'Independent recruiter',
  'Enterprise Corporation',
  'Startup / Scaleup',
  'Non-profit / NGO'
];

const PRIMARY_INDUSTRIES = [
  'Software & SaaS',
  'Fintech & Banking',
  'Healthcare & HealthTech',
  'E-commerce & D2C',
  'Digital Marketing & Advertising',
  'Education & EdTech',
  'Manufacturing & Hardware',
  'Real Estate & PropTech',
  'Logistics & Supply Chain',
  'Consulting & Professional Services',
  'Media & Entertainment',
  'Cybersecurity',
  'AI & Machine Learning',
  'Other'
];

const COMPANY_SIZES = [
  '1–10',
  '11–50',
  '51–200',
  '201–500',
  '501–1,000',
  '1,001+'
];

const CUSTOMER_MODELS = ['B2B', 'B2C', 'B2B2C', 'D2C', 'Other'];

const REVENUE_MODELS = [
  'Subscription (SaaS)',
  'One-time purchase',
  'Services / Consulting',
  'Usage-based / Metered',
  'Marketplace commission',
  'Retainer',
  'Other'
];

const ROUTES_TO_MARKET = [
  'Self-service (Product-Led)',
  'Inside sales',
  'Field sales (Enterprise)',
  'Product-led growth (PLG)',
  'Channel partners',
  'Inbound marketing / SEO',
  'Outbound sales',
  'Community-driven'
];

const BUYING_CYCLES = [
  'Same day',
  'Under 1 month',
  '1–3 months',
  '3–6 months',
  '6+ months'
];

const MARKET_SCOPES = [
  'Local',
  'Regional',
  'National',
  'International',
  'Global'
];

const CUSTOMER_SEGMENTS = [
  'Enterprise',
  'Mid-market',
  'SMB',
  'Consumer'
];

const POSITIONING_OPTIONS = [
  'Premium / High-end',
  'Value-focused / Cost-effective',
  'Category creator / Innovator',
  'Specialist / Niche expert',
  'Challenger brand',
  'Established market leader'
];

const BUSINESS_STAGES = [
  'Pre-launch',
  'MVP',
  'Early traction',
  'Growth',
  'Scale',
  'Mature',
  'Turnaround / Repositioning'
];

const MARKETING_MATURITIES = [
  'Just starting',
  'Foundational',
  'Inconsistent',
  'Scaling',
  'Optimised'
];

const BUSINESS_PRIORITY_OPTIONS = [
  'Customer Acquisition',
  'Revenue Growth',
  'Brand Awareness',
  'Retention & Churn Reduction',
  'New Market Expansion',
  'Product-Market Fit',
  'Margin Improvement',
  'Hiring Key Talent'
];

const PLANNING_HORIZONS = [
  'Next 3 months',
  'Next 6 months',
  'Next 12 months',
  '18+ months'
];

const TEAM_SIZES = [
  '0 (No dedicated marketing)',
  '1 (Solo operator)',
  '2–5',
  '6–10',
  '11+'
];

const CAPABILITY_OPTIONS = [
  'Content marketing',
  'SEO / Organic search',
  'Paid media / Ads',
  'Lifecycle / Email',
  'Social media & Community',
  'Brand & Graphic design',
  'Events & Field marketing',
  'PR & Communications',
  'Marketing Ops & RevOps',
  'Product marketing',
  'None currently'
];

const LEADERSHIP_STRUCTURES = [
  'Founder-led',
  'Dedicated marketing lead (VP/CMO/Director)',
  'Fractional marketing lead',
  'No current marketing leader'
];

const WORKPLACE_MODELS = [
  'Remote-First',
  'Hybrid',
  'On-site / Office-based',
  'Role-dependent'
];

const EMPLOYMENT_TYPES_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract / Freelance',
  'Internship',
  'Any'
];

const STANDARD_BENEFITS = [
  'Health Insurance & OPD',
  'Flexible Working Hours',
  'Remote Work Stipend',
  'Annual Learning & Certifications Budget',
  'Performance & Spot Bonuses',
  'Generous Paid Time Off (PTO)',
  'ESOPs / Stock Options',
  'Mental Wellness Programs',
  'Paid Parental Leave',
  'Annual Company Retreats'
];

// ── Step 7: Statutory Compliance Documents Configuration ─────────────────────
const COMPLIANCE_DOCUMENTS_CONFIG = [
  {
    key: 'pan_card',
    title: 'Company PAN card',
    shortTitle: 'PAN Card',
    numberLabel: 'Company PAN Number',
    placeholder: 'e.g. AAACU1234K',
    desc: 'Permanent Account Number issued by the Income Tax Department for corporate tax compliance.',
    badge: 'Statutory Option',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    key: 'labour_license',
    title: 'Labour License',
    shortTitle: 'Labour License',
    numberLabel: 'Labour License / Registration Number',
    placeholder: 'e.g. LAB/2024/98765',
    desc: 'Registration certificate under the State Labour Department / Shops & Commercial Establishments Act.',
    badge: 'Statutory Option',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    key: 'trade_license',
    title: 'Trade License',
    shortTitle: 'Trade License',
    numberLabel: 'Trade License Number',
    placeholder: 'e.g. TRD-GHMC-54321',
    desc: 'Municipal Corporation or local government body permit allowing legal trade and commercial operations.',
    badge: 'Statutory Option',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  {
    key: 'coi',
    title: 'COI (Certificate of Incorporation)',
    shortTitle: 'COI',
    numberLabel: 'Corporate Identity Number (CIN) / Registration No.',
    placeholder: 'e.g. U72200TG2022PTC123456',
    desc: 'Official Certificate of Incorporation issued by Ministry of Corporate Affairs (MCA) / RoC.',
    badge: 'Statutory Option',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    key: 'registration_doc',
    title: 'Company Registration document',
    shortTitle: 'Registration Document',
    numberLabel: 'Registration / GSTIN / Udyam Number',
    placeholder: 'e.g. 36AAACU1234K1Z0 or UDYAM-TS-01-0012345',
    desc: 'Statutory business registration certificate (GST Registration, MSME / Udyam Certificate, or Partnership Deed).',
    badge: 'Statutory Option',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
];

export default function CompanyProfile() {
  const { user, refreshUser } = useAuth();
  const comp = user?.profile || {};

  const isStaff = user?.role === 'RECRUITER' || user?.role === 'HIRING_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  // ── Staff Personal Profile State ─────────────────────────────────────────
  const [staffData, setStaffData] = useState({
    name: comp.name || comp.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Staff Member'),
    email: user?.email || '',
    phone: comp.phone || '',
    place: comp.place || comp.location || '',
    role: user?.role === 'RECRUITER' ? 'Recruiter' : (user?.role === 'HIRING_MANAGER' ? 'Hiring Manager' : (comp.role || 'Staff')),
    title: comp.title || (user?.role === 'RECRUITER' ? 'Technical Recruiter' : 'Hiring Manager'),
    avatar_url: comp.avatar_url || ''
  });

  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const staffPhotoInputRef = useRef(null);

  // ── Organization & Blueprint State ───────────────────────────────────────
  const [formData, setFormData] = useState({
    company_name: comp.company_name || '',
    logo_url: comp.logo_url || '',
    phone: comp.phone || '',
    website: comp.website || '',
    no_website: !comp.website,
    industry: comp.industry || '',
    primary_industry: comp.primary_industry || comp.industry || '',
    sub_industry: comp.sub_industry || '',
    organisation_type: comp.organisation_type || '',
    company_size: comp.company_size || '',
    location: comp.location || comp.headquarters_location || '',
    headquarters_location: comp.headquarters_location || comp.location || '',
    other_locations: comp.other_locations || '',
    linkedin_url: comp.linkedin_url || '',
    year_founded: comp.year_founded || '',
    about: comp.about || '',

    // Top-level legacy fields for backwards compatibility
    product_service: comp.product_service || '',
    business_model: comp.business_model || '',
    growth_stage: comp.growth_stage || '',
    target_audience: comp.target_audience || '',
    ideal_customer_profile: comp.ideal_customer_profile || '',
    business_problem: comp.business_problem || '',
    expected_outcome: comp.expected_outcome || '',
    team_support: comp.team_support || '',
    monthly_budget_range: comp.monthly_budget_range || '',
    decision_authority: comp.decision_authority || '',
    success_horizon: comp.success_horizon || '',

    // The 6 structured JSON blueprint objects
    business_model_data: comp.business_model_data || {},
    target_audience_data: comp.target_audience_data || {},
    growth_stage_data: comp.growth_stage_data || {},
    marketing_team_data: comp.marketing_team_data || {},
    hiring_defaults_data: comp.hiring_defaults_data || {},
    compliance_documents_data: comp.compliance_documents_data || {}
  });

  // 7 Blueprint tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'business_model' | 'target_audience' | 'growth_stage' | 'marketing_team' | 'hiring_defaults' | 'compliance_documents'
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [editModalTab, setEditModalTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [completedTabs, setCompletedTabs] = useState(new Set());
  const [sectionSaving, setSectionSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Step 7 compliance document upload & modal preview state
  const [uploadingDocKey, setUploadingDocKey] = useState(null);
  const [previewDocModal, setPreviewDocModal] = useState(null);
  const fileInputRefs = useRef({});

  const logoInputRef = useRef(null);

  // Headquarters State/City builder state
  const initialHq = parseInitialHq(comp.headquarters_location || comp.location || '');
  const [hqMode, setHqMode] = useState(initialHq.isCustom ? 'custom' : 'dropdown');
  const [hqState, setHqState] = useState(initialHq.state || '');
  const [hqCity, setHqCity] = useState(initialHq.city || '');
  const [hqCustomCity, setHqCustomCity] = useState('');
  const [isHqOtherCity, setIsHqOtherCity] = useState(false);

  const handleHqStateChange = (e) => {
    const st = e.target.value;
    setHqState(st);
    setHqCity('');
    setIsHqOtherCity(false);
    setHqCustomCity('');
    clearFieldError('headquarters_location');
    clearFieldError('location');
    if (st) {
      const formatted = `${st}, India`;
      setFormData(prev => ({
        ...prev,
        headquarters_location: formatted,
        location: formatted
      }));
    }
  };

  const handleHqCityChange = (e) => {
    const val = e.target.value;
    if (val === '__OTHER__') {
      setIsHqOtherCity(true);
      setHqCity('');
    } else {
      setIsHqOtherCity(false);
      setHqCity(val);
      if (val && hqState) {
        const formatted = `${val}, ${hqState}, India`;
        clearFieldError('headquarters_location');
        clearFieldError('location');
        setFormData(prev => ({
          ...prev,
          headquarters_location: formatted,
          location: formatted
        }));
      }
    }
  };

  const handleHqCustomCityChange = (e) => {
    const customCity = e.target.value;
    setHqCustomCity(customCity);
    if (customCity && hqState) {
      const formatted = `${customCity}, ${hqState}, India`;
      clearFieldError('headquarters_location');
      clearFieldError('location');
      setFormData(prev => ({
        ...prev,
        headquarters_location: formatted,
        location: formatted
      }));
    }
  };

  useEffect(() => {
    if (user?.profile) {
      setStaffData(prev => ({
        ...prev,
        name: user.profile.name || user.profile.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.profile.phone || prev.phone,
        place: user.profile.place || user.profile.location || prev.place,
        role: user.role === 'RECRUITER' ? 'Recruiter' : (user.role === 'HIRING_MANAGER' ? 'Hiring Manager' : (user.profile.role || prev.role)),
        title: user.profile.title || prev.title,
        avatar_url: user.profile.avatar_url || prev.avatar_url
      }));

      setFormData(prev => ({
        ...prev,
        company_name: user.profile.company_name ?? prev.company_name,
        logo_url: user.profile.logo_url ?? prev.logo_url,
        phone: user.profile.phone ?? prev.phone,
        website: user.profile.website ?? prev.website,
        no_website: !user.profile.website,
        industry: user.profile.industry ?? prev.industry,
        primary_industry: user.profile.primary_industry ?? user.profile.industry ?? prev.primary_industry,
        sub_industry: user.profile.sub_industry ?? prev.sub_industry,
        organisation_type: user.profile.organisation_type ?? prev.organisation_type,
        company_size: user.profile.company_size ?? prev.company_size,
        location: user.profile.location ?? user.profile.headquarters_location ?? prev.location,
        headquarters_location: user.profile.headquarters_location ?? user.profile.location ?? prev.headquarters_location,
        other_locations: user.profile.other_locations ?? prev.other_locations,
        linkedin_url: user.profile.linkedin_url ?? prev.linkedin_url,
        year_founded: user.profile.year_founded ?? prev.year_founded,
        about: user.profile.about || '',
        product_service: user.profile.product_service ?? prev.product_service,
        business_model: user.profile.business_model ?? prev.business_model,
        growth_stage: user.profile.growth_stage ?? prev.growth_stage,
        target_audience: user.profile.target_audience ?? prev.target_audience,
        ideal_customer_profile: user.profile.ideal_customer_profile ?? prev.ideal_customer_profile,
        business_problem: user.profile.business_problem ?? prev.business_problem,
        expected_outcome: user.profile.expected_outcome ?? prev.expected_outcome,
        team_support: user.profile.team_support ?? prev.team_support,
        monthly_budget_range: user.profile.monthly_budget_range ?? prev.monthly_budget_range,
        decision_authority: user.profile.decision_authority ?? prev.decision_authority,
        success_horizon: user.profile.success_horizon ?? prev.success_horizon,
        business_model_data: user.profile.business_model_data ?? prev.business_model_data ?? {},
        target_audience_data: user.profile.target_audience_data ?? prev.target_audience_data ?? {},
        growth_stage_data: user.profile.growth_stage_data ?? prev.growth_stage_data ?? {},
        marketing_team_data: user.profile.marketing_team_data ?? prev.marketing_team_data ?? {},
        hiring_defaults_data: user.profile.hiring_defaults_data ?? prev.hiring_defaults_data ?? {},
        compliance_documents_data: user.profile.compliance_documents_data ?? prev.compliance_documents_data ?? {}
      }));

      const rawHq = user.profile.headquarters_location || user.profile.location;
      if (rawHq) {
        const parsed = parseInitialHq(rawHq);
        if (parsed.state) setHqState(parsed.state);
        if (parsed.city) setHqCity(parsed.city);
        if (parsed.isCustom) setHqMode('custom');
      }
    }

    loadAdditionalData();
  }, [user]);

  const loadAdditionalData = async () => {
    try {
      const [membersData, jobsData] = await Promise.all([
        api.getTeamMembers().catch(() => []),
        api.getMyJobs().catch(() => [])
      ]);
      setTeamMembers(membersData || []);
      setMyJobs(jobsData || []);
    } catch (err) {
      console.error('Failed to load supplemental data:', err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ── Helper to update top-level & JSON nested fields ───────────────────────
  const clearFieldError = (fieldName) => {
    setValidationErrors(prev => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearFieldError(name);
    if (name === 'headquarters_location' || name === 'location') {
      clearFieldError('headquarters_location');
      clearFieldError('location');
    }
    if (name === 'primary_industry' || name === 'industry') {
      clearFieldError('primary_industry');
      clearFieldError('industry');
    }
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'headquarters_location') {
        updated.location = value;
      } else if (name === 'location') {
        updated.headquarters_location = value;
      }
      if (name === 'primary_industry') {
        updated.industry = value;
      } else if (name === 'industry') {
        updated.primary_industry = value;
      }
      return updated;
    });
  };

  const updateJsonField = (section, field, value) => {
    clearFieldError(field);
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  const toggleJsonArrayItem = (section, field, item, maxAllowed = null) => {
    clearFieldError(field);
    setFormData(prev => {
      const currentList = Array.isArray(prev[section]?.[field]) ? prev[section][field] : [];
      let updated;
      if (currentList.includes(item)) {
        updated = currentList.filter(x => x !== item);
      } else {
        if (maxAllowed && currentList.length >= maxAllowed) {
          showToast(`Maximum ${maxAllowed} selections allowed for this field.`);
          return prev;
        }
        updated = [...currentList, item];
      }
      return {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [field]: updated
        }
      };
    });
  };

  // ── S3 Logo Upload ────────────────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo image size exceeds 5MB limit.');
      return;
    }

    setLogoError('');
    setUploadingLogo(true);

    try {
      const res = await api.uploadCompanyLogo(file);
      if (res?.logo_url) {
        setFormData(prev => ({ ...prev, logo_url: res.logo_url }));
        showToast('✨ Company logo successfully uploaded to AWS S3!');
        await refreshUser?.();
      }
    } catch (err) {
      setLogoError(err.message || 'Failed to upload logo to AWS S3.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Step 7: Statutory Compliance Documents & Photo Handlers ───────────────
  const handleComplianceDocUpload = async (docKey, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Document file size exceeds 10MB limit.');
      return;
    }

    setUploadingDocKey(docKey);
    try {
      const res = await api.uploadCompanyComplianceDoc(file, docKey);
      if (res?.file_url) {
        clearFieldError('compliance_documents');
        setFormData(prev => {
          const existingDoc = prev.compliance_documents_data?.[docKey] || {};
          return {
            ...prev,
            compliance_documents_data: {
              ...(prev.compliance_documents_data || {}),
              [docKey]: {
                ...existingDoc,
                file_url: res.file_url,
                file_name: res.file_name || file.name,
                uploaded_at: new Date().toISOString(),
                status: 'UPLOADED'
              }
            }
          };
        });
        showToast(`✨ Successfully uploaded ${file.name}!`);
      }
    } catch (err) {
      showToast(`Error uploading: ${err.message || 'Failed to upload document'}`);
    } finally {
      setUploadingDocKey(null);
    }
  };

  const updateDocField = (docKey, field, value) => {
    clearFieldError('compliance_documents');
    setFormData(prev => ({
      ...prev,
      compliance_documents_data: {
        ...(prev.compliance_documents_data || {}),
        [docKey]: {
          ...(prev.compliance_documents_data?.[docKey] || {}),
          [field]: value
        }
      }
    }));
  };

  const handleRemoveDoc = (docKey) => {
    setFormData(prev => {
      const current = { ...(prev.compliance_documents_data || {}) };
      delete current[docKey];
      return {
        ...prev,
        compliance_documents_data: current
      };
    });
    showToast('Document removed.');
  };

  // ── Staff Profile Handlers ────────────────────────────────────────────────
  const handleStaffChange = (e) => {
    setStaffData({ ...staffData, [e.target.name]: e.target.value });
  };

  const handleStaffPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setUploadingStaffPhoto(true);
    try {
      const res = await api.uploadStaffPhoto(file);
      if (res?.avatar_url) {
        setStaffData(prev => ({ ...prev, avatar_url: res.avatar_url }));
        showToast('✨ Staff profile photo updated successfully!');
        await refreshUser?.();
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  const handleSaveStaffProfile = async (e) => {
    e.preventDefault();
    setSavingStaff(true);
    try {
      await api.updateStaffProfile({
        name: staffData.name,
        phone: staffData.phone,
        place: staffData.place,
        title: staffData.title
      });
      await refreshUser?.();
      showToast('✨ Profile details updated successfully!');
      setIsEditingStaff(false);
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to update profile'}`);
    } finally {
      setSavingStaff(false);
    }
  };

  // ── Save Entire Profile or Section ────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      // Also sync top-level legacy fields from json objects for complete backward compatibility
      const payload = {
        ...formData,
        product_service: formData.business_model_data?.product_name || formData.product_service,
        business_model: formData.business_model_data?.revenue_model || formData.business_model,
        growth_stage: formData.growth_stage_data?.business_stage || formData.growth_stage,
        target_audience: formData.target_audience_data?.target_markets || formData.target_audience,
        ideal_customer_profile: formData.target_audience_data?.customer_problem || formData.ideal_customer_profile,
        business_problem: formData.growth_stage_data?.marketing_challenge || formData.business_problem,
        expected_outcome: formData.growth_stage_data?.desired_outcomes || formData.expected_outcome,
        team_support: formData.marketing_team_data?.team_size || formData.team_support,
        monthly_budget_range: formData.marketing_team_data?.monthly_budget_range || formData.monthly_budget_range,
        decision_authority: formData.marketing_team_data?.decision_authority || formData.decision_authority,
        success_horizon: formData.growth_stage_data?.planning_horizon || formData.success_horizon
      };

      await api.updateCompanyProfile(payload);
      await refreshUser?.();
      showToast('✨ Organization intelligence profile updated successfully!');
      setIsEditingOrg(false);
      setCompletedTabs(prev => new Set([...prev, activeTab]));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('uptrix:company_profile_updated', { detail: payload }));
      }
      return true;
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to update profile'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSaveSection = async () => {
    setSectionSaving(true);
    try {
      await api.updateCompanyProfile(formData);
      await refreshUser?.();
      showToast('✨ Section saved successfully!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('uptrix:company_profile_updated', { detail: formData }));
      }
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to save section'}`);
    } finally {
      setSectionSaving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  };

  const [requestingVerification, setRequestingVerification] = useState(false);

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    try {
      // Validate all 7 steps before requesting verification
      for (const tabId of TAB_ORDER) {
        const { isValid, errors, firstErrorField } = validateStep(tabId);
        if (!isValid) {
          setActiveTab(tabId);
          setValidationErrors(errors);
          const tabLabel = TABS.find(t => t.id === tabId)?.label || tabId;
          showToast(`⚠️ Please complete required fields marked in red in Step: ${tabLabel}`);
          setRequestingVerification(false);
          setTimeout(() => {
            if (firstErrorField) {
              const el = document.querySelector(`[name="${firstErrorField}"]`) || document.getElementById(`field-${firstErrorField}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (el.focus) el.focus();
              }
            }
          }, 150);
          return;
        }
      }

      // Save current profile form
      const saved = await handleSubmit();
      if (saved === false) {
        setRequestingVerification(false);
        return;
      }
      const res = await api.requestCompanyVerification();
      showToast(res.message || '✨ Verification request submitted for inspect review successfully!');
      await refreshUser?.();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('uptrix:company_verification_requested'));
      }
    } catch (err) {
      showToast(`Verification Request Error: ${err.message || 'Failed to submit for verification'}`);
    } finally {
      setRequestingVerification(false);
    }
  };

  // ── Render Tabs Definition ────────────────────────────────────────────────
  const TABS = [
    { id: 'overview', label: 'Company Profile', icon: Building2, desc: 'Corporate identity & overview' },
    { id: 'business_model', label: 'Products & Business Model', icon: Layers, desc: 'Offerings & revenue model' },
    { id: 'target_audience', label: 'Target Audience & Buyers', icon: Target, desc: 'Geographies & buyer personas' },
    { id: 'growth_stage', label: 'Growth Stage & Priorities', icon: TrendingUp, desc: 'Stage & commercial horizon' },
    { id: 'marketing_team', label: 'Team, Capabilities & Tools', icon: Users, desc: 'Headcount, tools & budget' },
    { id: 'hiring_defaults', label: 'Hiring Defaults & Showcase', icon: Briefcase, desc: 'Workplace defaults & cascade' },
    { id: 'compliance_documents', label: 'Compliance & Documents', icon: FileCheck, desc: 'Company PAN, COI, Labour & Trade licenses' }
  ];

  const TAB_ORDER = ['overview', 'business_model', 'target_audience', 'growth_stage', 'marketing_team', 'hiring_defaults', 'compliance_documents'];

  // Helper shortcut accessors for JSON fields
  const bm = formData.business_model_data || {};
  const ta = formData.target_audience_data || {};
  const gs = formData.growth_stage_data || {};
  const mt = formData.marketing_team_data || {};
  const hd = formData.hiring_defaults_data || {};
  const cd = formData.compliance_documents_data || {};
  const validComplianceDocsCount = ['pan_card', 'labour_license', 'trade_license', 'coi', 'registration_doc'].filter(
    k => Boolean(cd[k] && (cd[k].file_url || cd[k].doc_number))
  ).length;

  const isTabCompleted = (tabId) => {
    switch (tabId) {
      case 'overview':
        return Boolean(
          formData.company_name?.trim() &&
          (formData.website?.trim() || formData.no_website) &&
          formData.organisation_type &&
          (formData.primary_industry || formData.industry) &&
          formData.company_size &&
          (formData.headquarters_location || formData.location) &&
          formData.about?.trim()
        );
      case 'business_model':
        return Boolean(
          bm.customer_model &&
          bm.revenue_model &&
          bm.offering_description?.trim()
        );
      case 'target_audience':
        return Boolean(
          ta.target_markets?.trim() &&
          ta.customer_segment &&
          ta.buyer_roles?.trim() &&
          ta.customer_problem?.trim()
        );
      case 'growth_stage':
        return Boolean(
          gs.business_stage &&
          gs.marketing_challenge?.trim() &&
          Array.isArray(gs.business_priorities) &&
          gs.business_priorities.length > 0
        );
      case 'marketing_team':
        return Boolean(
          mt.team_size &&
          mt.leadership_structure
        );
      case 'hiring_defaults':
        return Boolean(
          hd.workplace_model &&
          Array.isArray(hd.employment_types) &&
          hd.employment_types.length > 0
        );
      case 'compliance_documents': {
        const count = ['pan_card', 'labour_license', 'trade_license', 'coi', 'registration_doc'].filter(
          k => Boolean(cd[k] && (cd[k].file_url || cd[k].doc_number))
        ).length;
        return count >= 2;
      }
      default:
        return false;
    }
  };

  const isCompleted = (tabId) => {
    return completedTabs.has(tabId) || isTabCompleted(tabId);
  };

  const allTabsCompleted = TAB_ORDER.every(id => isCompleted(id));
  const completedTabsCount = TAB_ORDER.filter(id => isCompleted(id)).length;
  const completionPercent = Math.round((completedTabsCount / TAB_ORDER.length) * 100);

  const currentStepIndex = TAB_ORDER.indexOf(activeTab);

  // ── Step Validation Engine ────────────────────────────────────────────────
  const validateStep = (tabId) => {
    const errors = {};
    let firstErrorField = null;

    const setErr = (field, msg) => {
      errors[field] = msg;
      if (!firstErrorField) firstErrorField = field;
    };

    if (tabId === 'overview') {
      if (!formData.company_name?.trim()) {
        setErr('company_name', 'Company display name is required');
      }
      if (!formData.no_website && !formData.website?.trim()) {
        setErr('website', 'Company website is required (or check "No website yet")');
      }
      if (!formData.organisation_type) {
        setErr('organisation_type', 'Please select an organisation type');
      }
      if (!formData.primary_industry && !formData.industry) {
        setErr('primary_industry', 'Please select a primary industry');
      }
      if (!formData.sub_industry?.trim()) {
        setErr('sub_industry', 'Sub-industry is required (e.g. B2B SaaS, HR Tech)');
      }
      if (!formData.company_size) {
        setErr('company_size', 'Please select company size');
      }
      if (!formData.headquarters_location?.trim() && !formData.location?.trim()) {
        setErr('headquarters_location', 'Headquarters location is required');
      }
      if (!formData.year_founded?.trim()) {
        setErr('year_founded', 'Year founded is required');
      }
      if (!formData.about?.trim()) {
        setErr('about', 'Company description & overview is required');
      }
    } else if (tabId === 'business_model') {
      if (!bm.customer_model) {
        setErr('customer_model', 'Please select a customer model');
      }
      if (!bm.offering_description?.trim()) {
        setErr('offering_description', 'Core offering description is required');
      }
      if (!bm.revenue_model) {
        setErr('revenue_model', 'Please select a revenue model');
      }
    } else if (tabId === 'target_audience') {
      if (!ta.target_markets?.trim()) {
        setErr('target_markets', 'Target geographic markets are required');
      }
      if (!ta.market_scope) {
        setErr('market_scope', 'Please select a market scope');
      }
      if (!ta.customer_segment) {
        setErr('customer_segment', 'Please select a primary customer segment');
      }
      if (!ta.buyer_roles?.trim()) {
        setErr('buyer_roles', 'Typical buyer / user roles are required');
      }
      if (!ta.customer_problem?.trim()) {
        setErr('customer_problem', 'Core customer problem solved is required');
      }
    } else if (tabId === 'growth_stage') {
      if (!gs.business_stage) {
        setErr('business_stage', 'Please select business stage');
      }
      if (!Array.isArray(gs.business_priorities) || gs.business_priorities.length === 0) {
        setErr('business_priorities', 'Please select at least 1 top business priority');
      }
      if (!gs.marketing_challenge?.trim()) {
        setErr('marketing_challenge', 'Biggest current marketing challenge is required');
      }
    } else if (tabId === 'marketing_team') {
      if (!mt.team_size) {
        setErr('team_size', 'Please select marketing team size');
      }
      if (!mt.leadership_structure) {
        setErr('leadership_structure', 'Please select leadership structure');
      }
    } else if (tabId === 'hiring_defaults') {
      if (!hd.workplace_model) {
        setErr('workplace_model', 'Please select a workplace model');
      }
      if (!Array.isArray(hd.employment_types) || hd.employment_types.length === 0) {
        setErr('employment_types', 'Please select at least 1 employment type offered');
      }
    } else if (tabId === 'compliance_documents') {
      if (validComplianceDocsCount < 2) {
        setErr('compliance_documents', `Please provide at least 2 compliance documents (${validComplianceDocsCount}/2 provided)`);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstErrorField
    };
  };

  const getInputClassName = (fieldName, customClass = '') => {
    const hasError = Boolean(validationErrors[fieldName]);
    if (hasError) {
      return `w-full px-3.5 py-2.5 rounded-xl border border-rose-500 bg-rose-50/20 text-xs font-medium text-rose-900 ring-2 ring-rose-500/20 outline-none transition-all ${customClass}`;
    }
    return `w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none transition-all ${customClass}`;
  };

  const getSelectClassName = (fieldName, customClass = '') => {
    const hasError = Boolean(validationErrors[fieldName]);
    if (hasError) {
      return `w-full px-3.5 py-2.5 rounded-xl border border-rose-500 bg-rose-50/20 text-xs font-semibold text-rose-900 ring-2 ring-rose-500/20 outline-none transition-all ${customClass}`;
    }
    return `w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none transition-all ${customClass}`;
  };

  const renderFieldError = (fieldName) => {
    if (!validationErrors[fieldName]) return null;
    return (
      <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>{validationErrors[fieldName]}</span>
      </p>
    );
  };

  const handleSaveAndNext = async (e) => {
    if (e) e.preventDefault();

    // Validate current step before advancing
    const { isValid, errors, firstErrorField } = validateStep(activeTab);
    if (!isValid) {
      setValidationErrors(errors);
      showToast('⚠️ Please fill in all required fields marked in red to continue.');
      if (firstErrorField) {
        const el = document.querySelector(`[name="${firstErrorField}"]`) || document.getElementById(`field-${firstErrorField}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (el.focus) el.focus();
        }
      }
      return;
    }

    setValidationErrors({});
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const nextTab = currentIndex < TAB_ORDER.length - 1 ? TAB_ORDER[currentIndex + 1] : null;

    setCompletedTabs(prev => new Set([...prev, activeTab]));
    const success = await handleSubmit(e);
    if (success !== false && nextTab) {
      setActiveTab(nextTab);
      const tabElement = document.getElementById('company-profile-tabs');
      if (tabElement) {
        tabElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleTabClick = (targetTabId) => {
    const currentIdx = TAB_ORDER.indexOf(activeTab);
    const targetIdx = TAB_ORDER.indexOf(targetTabId);

    // If attempting to advance to a future step, validate current step first!
    if (targetIdx > currentIdx) {
      const { isValid, errors, firstErrorField } = validateStep(activeTab);
      if (!isValid) {
        setValidationErrors(errors);
        showToast('⚠️ Please fill in all required fields marked in red before advancing.');
        if (firstErrorField) {
          const el = document.querySelector(`[name="${firstErrorField}"]`) || document.getElementById(`field-${firstErrorField}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (el.focus) el.focus();
          }
        }
        return;
      }
    }

    setValidationErrors({});
    setActiveTab(targetTabId);
    const tabElement = document.getElementById('company-profile-tabs');
    if (tabElement) {
      tabElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevTab = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      setValidationErrors({});
      setActiveTab(TAB_ORDER[currentIndex - 1]);
      const tabElement = document.getElementById('company-profile-tabs');
      if (tabElement) {
        tabElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RECRUITER & HIRING MANAGER VIEW: Personal Staff Profile ONLY
  // ═══════════════════════════════════════════════════════════════════════════
  if (isStaff) {
    return (
      <div
        className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
              <span>Workspace</span>
              <span>/</span>
              <span>Team & Members</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Staff Profile</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF7043] flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </span>
              My Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              Personal staff credentials, contact details, and hiring workspace access.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all bg-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              Share Profile
            </button>
            <button
              type="button"
              onClick={() => setIsEditingStaff(true)}
              className="px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
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

        {/* Staff Dossier Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left Col: Personal Credentials */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-100 text-slate-800 font-bold text-2xl flex items-center justify-center overflow-hidden shadow-2xs">
                    {staffData.avatar_url ? (
                      <img src={staffData.avatar_url} alt={staffData.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{staffData.name ? staffData.name.charAt(0).toUpperCase() : 'S'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => staffPhotoInputRef.current?.click()}
                    disabled={uploadingStaffPhoto}
                    title="Upload profile photo"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
                  >
                    {uploadingStaffPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                  <input type="file" ref={staffPhotoInputRef} accept="image/*" className="hidden" onChange={handleStaffPhotoUpload} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{staffData.name}</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{staffData.title} • {comp.company_name || 'Organization'}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md mt-1.5">
                    <User className="w-3 h-3 text-[#5C59E8]" /> {staffData.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingStaff(true)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 bg-white cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Personal Info
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Official Work Email</span>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-500" /> {staffData.email || '-'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Contact Phone</span>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-500" /> {staffData.phone || 'Not provided'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Staff Office Location</span>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {staffData.place || 'Not provided'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Account Role & Privileges</span>
                <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Licensed {staffData.role} Seat</p>
              </div>
            </div>
          </div>

          {/* Right Col: Workspace & Capabilities */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Workspace Authorization</h3>
                  <p className="text-xs text-slate-400">Enterprise seat status</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active Provisioned Seat
                </div>
                <p className="text-[11px] text-emerald-700/90 leading-relaxed">
                  Your account is licensed on the {comp.company_name || 'Organization'} hiring portal.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  'Post & publish job requisitions',
                  'Source & filter candidate profiles',
                  'Schedule & conduct interview rounds',
                  'Advance candidate pipeline stages',
                  'Direct messaging & candidate communications'
                ].map((cap, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-medium text-[11.5px]">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Staff Profile Modal */}
        {isEditingStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in select-text">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5C59E8] flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit Staff Profile</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Update personal staff credentials and office location</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingStaff(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={staffData.name}
                      onChange={handleStaffChange}
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Designation Title</label>
                    <input
                      type="text"
                      name="title"
                      value={staffData.title}
                      onChange={handleStaffChange}
                      placeholder="e.g. Technical Recruiter"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={staffData.phone}
                      onChange={handleStaffChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Office Location *</label>
                    <input
                      type="text"
                      name="place"
                      value={staffData.place}
                      onChange={handleStaffChange}
                      required
                      placeholder="e.g. Hyderabad, India"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingStaff(false)}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="px-5 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                  >
                    {savingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ADMINISTRATOR VIEW: Full 6-Section Organization Intelligence Blueprint
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5C59E8] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </span>
            Company Profile & Business Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            7-step corporate intelligence blueprint & compliance dossier. Configured defaults automatically cascade into the Post Job wizard.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all bg-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            Share
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{loading ? 'Saving Changes...' : 'Save Profile Blueprint'}</span>
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
          {/* ── Organization Banner Card ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Logo Avatar with S3 Upload Button */}
                <div className="relative inline-block shrink-0 group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-slate-200/80 shadow-2xs bg-white text-slate-900 font-bold text-2xl sm:text-3xl flex items-center justify-center overflow-hidden">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt={formData.company_name}
                        className="w-full h-full object-contain p-2 bg-white"
                        onError={e => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-bold"
                      style={{ display: formData.logo_url ? 'none' : 'flex' }}
                    >
                      {formData.company_name ? formData.company_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    title="Upload S3 Company Logo"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                {/* Name, Industry & Badges */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {formData.company_name || 'Organization Name'}
                    </h2>
                    {comp.is_verified || comp.verification_status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Employer
                      </span>
                    ) : comp.verification_status === 'UNDER_REVIEW' ? (
                      <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Under Inspect Review
                      </span>
                    ) : comp.verification_status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Verification Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-md">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        Pending Verification ({completionPercent}%)
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                      <Sparkles className="w-3.5 h-3.5 text-[#5C59E8]" />
                      Smart Cascade Active
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                    {formData.primary_industry || formData.industry || 'Industry not specified'}
                    {formData.organisation_type ? ` • ${formData.organisation_type}` : ''}
                    {formData.year_founded ? ` • Est. ${formData.year_founded}` : ''}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {formData.headquarters_location || formData.location || 'Headquarters not set'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {formData.company_size || 'Size not set'}
                    </span>
                    {formData.website ? (
                      <>
                        <span className="text-slate-300">•</span>
                        <a
                          href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#5C59E8] font-semibold hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Website <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 italic">No website yet</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Superadmin Verification & Free Trial Unlock Status Banner ── */}
          {comp.verification_status === 'REJECTED' ? (
            <div className="rounded-2xl p-4 sm:p-5 bg-rose-50 border border-rose-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    Verification Needs Corrections
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">Action Required</span>
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    <strong>Superadmin Feedback:</strong> {comp.verification_rejection_reason || 'Compliance document photos or business details did not meet our verification standards. Please inspect Tab 7 and update accordingly.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('compliance_documents');
                  document.getElementById('company-profile-tabs')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-all cursor-pointer border-none shadow-2xs"
              >
                Fix in Step 7
              </button>
            </div>
          ) : comp.verification_status === 'UNDER_REVIEW' ? (
            <div className="rounded-2xl p-4 sm:p-5 bg-amber-50/90 border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    Profile Submitted & Under Inspect Review
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Queue Active</span>
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Our compliance team is inspecting your statutory document photos (PAN, Labour, Trade, COI, Registration doc). Your 30-day Free Trial (1 Active Job & 5 Candidate Unlocks) will unlock immediately once approved.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-amber-700">Need instant access?</span>
                <button
                  type="button"
                  onClick={() => window.location.hash = '#upgrade'}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all border-none cursor-pointer"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          ) : !comp.is_verified && comp.verification_status !== 'VERIFIED' ? (
            <div className={`rounded-2xl p-4 sm:p-5 border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              allTabsCompleted ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-emerald-200' : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  allTabsCompleted ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  {allTabsCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4 text-slate-500" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {allTabsCompleted ? '🎉 100% Profile Complete — Ready for Verification!' : `Company Profile Progress: ${completionPercent}% Complete (${completedTabsCount}/7 Steps)`}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      allTabsCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {allTabsCompleted ? 'All Steps Finished' : 'Free Trial Locked'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {allTabsCompleted
                      ? 'Submit your verified profile and statutory documents to unlock your 30-Day Free Trial instantly upon Superadmin review.'
                      : 'To unlock your Free Trial, complete all 7 blueprint steps and upload statutory compliance document photos (PAN, Labour License, Trade License, COI, Registration doc).'}
                  </p>
                </div>
              </div>
              {allTabsCompleted ? (
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  disabled={requestingVerification || loading}
                  className="px-4 py-2.5 rounded-xl bg-[#5C59E8] hover:bg-[#4E4AD6] text-white text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer border-none shadow-md disabled:opacity-50"
                >
                  {requestingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Submit for Superadmin Verification</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const firstIncomplete = TAB_ORDER.find(id => !isCompleted(id));
                    if (firstIncomplete) handleTabClick(firstIncomplete);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold shrink-0 transition-all border-none cursor-pointer"
                >
                  Continue Profile →
                </button>
              )}
            </div>
          ) : null}

          {/* ── 6-Section Segmented Tab Switcher Bar ── */}
          <div id="company-profile-tabs" className="space-y-2.5">
            {/* 6 Tabs in ONE SINGLE UNBROKEN LINE */}
            <div className="w-full overflow-x-auto no-scrollbar">
              <div className="w-full flex items-center p-1 bg-slate-100/95 rounded-2xl border border-slate-200/80 shadow-2xs gap-1 flex-nowrap min-w-max xl:min-w-full">
                {TABS.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const done = isCompleted(tab.id);
                  const stepNum = idx + 1;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : done
                          ? 'text-slate-800 hover:text-slate-900 bg-transparent font-medium hover:bg-white/50'
                          : 'text-slate-500 hover:text-slate-900 bg-transparent font-medium hover:bg-white/40'
                      }`}
                    >
                      {done ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                          ✓
                        </span>
                      ) : (
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive ? 'bg-[#FF7043] text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {stepNum}
                        </span>
                      )}
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#FF7043]' : (done ? 'text-emerald-600' : 'text-slate-400')}`} />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB CONTENT: 6 INLINE-EDITABLE SECTIONS (NO POPUP MODAL)             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* 1. SECTION 1: COMPANY PROFILE OVERVIEW                            */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Main Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6">
                  {/* Top Header Banner */}
                  <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF7043]/10 border border-[#FF7043]/20 flex items-center justify-center text-[#FF7043] shrink-0 shadow-2xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Corporate Identity & Operations</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF7043]/10 text-[#E65B30] border border-[#FF7043]/20">
                            Step 1 of 6
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Foundational organization profile, verified branding, and location parameters</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Sub-Section 1: Core Corporate Identity ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF7043]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Core Corporate Identity</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Public brand & business structure</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Company Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Company Display Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            name="company_name"
                            id="field-company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            placeholder="e.g. Uptrix Technologies"
                            className={`${getInputClassName('company_name')} pl-10`}
                          />
                        </div>
                        {renderFieldError('company_name')}
                        <p className="text-[11px] text-slate-400 mt-1">Official employer name shown on job boards and candidate applications.</p>
                      </div>

                      {/* Company Website */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            Company Website <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !formData.no_website;
                              clearFieldError('website');
                              setFormData(prev => ({ ...prev, no_website: nextVal, website: nextVal ? '' : prev.website }));
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                              formData.no_website 
                                ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs font-bold' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${formData.no_website ? 'bg-amber-500' : 'bg-slate-300'}`} />
                            <span>No website yet</span>
                          </button>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Globe className="w-4 h-4" />
                          </div>
                          <input
                            type="url"
                            name="website"
                            id="field-website"
                            value={formData.website}
                            onChange={handleChange}
                            disabled={formData.no_website}
                            placeholder={formData.no_website ? 'Operating in stealth / No active URL' : 'https://example.com'}
                            className={`${getInputClassName('website', formData.no_website ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : '')} pl-10 pr-20`}
                          />
                          {!formData.no_website && formData.website && (
                            <a
                              href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[11px] font-semibold text-[#FF7043] hover:text-[#E65B30] gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Visit</span>
                            </a>
                          )}
                        </div>
                        {renderFieldError('website')}
                      </div>

                      {/* Year Founded */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            Year Founded <span className="text-rose-500">*</span>
                          </label>
                          {formData.year_founded && parseInt(formData.year_founded, 10) > 1900 && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                              {new Date().getFullYear() - parseInt(formData.year_founded, 10) <= 0 
                                ? 'Founded this year' 
                                : `${new Date().getFullYear() - parseInt(formData.year_founded, 10)} years in business`}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            name="year_founded"
                            id="field-year_founded"
                            value={formData.year_founded}
                            onChange={handleChange}
                            placeholder="e.g. 2020"
                            className={`${getInputClassName('year_founded')} pl-10`}
                          />
                        </div>
                        {renderFieldError('year_founded')}
                      </div>

                      {/* Organisation Type */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Organisation Type <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <select
                            name="organisation_type"
                            id="field-organisation_type"
                            value={formData.organisation_type}
                            onChange={handleChange}
                            className={`${getSelectClassName('organisation_type')} pl-10 cursor-pointer`}
                          >
                            <option value="">Select organisation type...</option>
                            {ORGANISATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        {renderFieldError('organisation_type')}
                      </div>
                    </div>
                  </div>

                  {/* ── Sub-Section 2: Industry & Scale ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#5C59E8]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Industry Classification & Scale</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Domain taxonomy & team size</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Primary Industry */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Primary Industry <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <select
                            name="primary_industry"
                            id="field-primary_industry"
                            value={formData.primary_industry || formData.industry}
                            onChange={handleChange}
                            className={`${getSelectClassName('primary_industry')} pl-10 cursor-pointer`}
                          >
                            <option value="">Select industry...</option>
                            {PRIMARY_INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                          </select>
                        </div>
                        {renderFieldError('primary_industry')}
                      </div>

                      {/* Sub-Industry */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Sub-Industry <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            name="sub_industry"
                            id="field-sub_industry"
                            value={formData.sub_industry}
                            onChange={handleChange}
                            placeholder="e.g. HR Tech, B2B SaaS"
                            className={`${getInputClassName('sub_industry')} pl-10`}
                          />
                        </div>
                        {renderFieldError('sub_industry')}
                      </div>

                      {/* Company Size */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Company Size <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Users className="w-4 h-4" />
                          </div>
                          <select
                            name="company_size"
                            id="field-company_size"
                            value={formData.company_size}
                            onChange={handleChange}
                            className={`${getSelectClassName('company_size')} pl-10 cursor-pointer`}
                          >
                            <option value="">Select company size...</option>
                            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                          </select>
                        </div>
                        {renderFieldError('company_size')}
                      </div>
                    </div>
                  </div>

                  {/* ── Sub-Section 3: Headquarters & Office Footprint ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">3. Headquarters & Office Footprint</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHqMode('dropdown')}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                            hqMode === 'dropdown'
                              ? 'bg-[#FF7043] text-white border-[#FF7043] shadow-2xs font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          🇮🇳 India Dropdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setHqMode('custom')}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                            hqMode === 'custom'
                              ? 'bg-[#FF7043] text-white border-[#FF7043] shadow-2xs font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          🌐 International / Custom
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Headquarters Builder */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#FF7043]" />
                            <span>Headquarters Location</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          {(formData.headquarters_location || formData.location) && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Current: {formData.headquarters_location || formData.location}</span>
                            </span>
                          )}
                        </div>

                        {hqMode === 'dropdown' ? (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* State Dropdown */}
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">State / Union Territory *</label>
                                <select
                                  value={hqState}
                                  onChange={handleHqStateChange}
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#FF7043] outline-none cursor-pointer shadow-2xs"
                                >
                                  <option value="">Select State / UT...</option>
                                  {INDIAN_STATES.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>

                              {/* City Dropdown */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[11px] font-semibold text-slate-600">City *</label>
                                  {isHqOtherCity && (
                                    <button
                                      type="button"
                                      onClick={() => { setIsHqOtherCity(false); setHqCity(''); }}
                                      className="text-[11px] text-[#FF7043] font-semibold hover:underline border-none bg-transparent cursor-pointer p-0"
                                    >
                                      Select from list
                                    </button>
                                  )}
                                </div>
                                {isHqOtherCity ? (
                                  <input
                                    type="text"
                                    value={hqCustomCity}
                                    onChange={handleHqCustomCityChange}
                                    placeholder="Enter custom city name"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#FF7043] outline-none shadow-2xs"
                                  />
                                ) : (
                                  <select
                                    value={hqCity}
                                    onChange={handleHqCityChange}
                                    disabled={!hqState}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#FF7043] outline-none cursor-pointer shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                  >
                                    <option value="">{hqState ? 'Select City...' : 'Select State first'}</option>
                                    {((hqState && INDIA_STATES_AND_CITIES[hqState]) || []).map(ct => (
                                      <option key={ct} value={ct}>{ct}</option>
                                    ))}
                                    {hqState && <option value="__OTHER__">Other (Enter manually)</option>}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Globe className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              name="headquarters_location"
                              id="field-headquarters_location"
                              value={formData.headquarters_location || formData.location}
                              onChange={handleChange}
                              placeholder="e.g. London, United Kingdom or Austin, Texas, USA"
                              className={`${getInputClassName('headquarters_location')} pl-10`}
                            />
                          </div>
                        )}
                        {renderFieldError('headquarters_location')}
                      </div>

                      {/* Other Office Locations */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <MapPinned className="w-3.5 h-3.5 text-slate-400" />
                          <span>Other Office Locations / Branches</span>
                        </label>
                        <input
                          type="text"
                          name="other_locations"
                          value={formData.other_locations}
                          onChange={handleChange}
                          placeholder="e.g. Bengaluru, Mumbai, London, Remote"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#FF7043] outline-none shadow-2xs"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Satellite hubs, regional development centers, or co-working spaces.</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Sub-Section 4: Direct Contact & Social Channels ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">4. Contact & Social Channels</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Recruiter verification & candidate trust</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Official Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Official Phone
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#FF7043] outline-none shadow-2xs"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Direct contact for candidate inquiries and recruiter onboarding verification.</p>
                      </div>

                      {/* LinkedIn Company Page */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            LinkedIn Company Page
                          </label>
                          {formData.linkedin_url && (
                            <a
                              href={formData.linkedin_url.startsWith('http') ? formData.linkedin_url : `https://${formData.linkedin_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Verify link</span>
                            </a>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0A66C2]">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <input
                            type="url"
                            name="linkedin_url"
                            value={formData.linkedin_url}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/company/yourcompany"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#FF7043] outline-none shadow-2xs"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Builds candidate confidence and authenticates company brand.</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Sub-Section 5: Company Description & Mission ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">5. Company Story & Workplace Overview</h4>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formData.about?.length || 0} characters
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#FF7043]" />
                          <span>Company Description & Overview</span>
                          <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <textarea
                        name="about"
                        id="field-about"
                        rows="4"
                        value={formData.about}
                        onChange={handleChange}
                        placeholder="Describe what the business does, your core mission, product vision, and workplace philosophy..."
                        className={`${getInputClassName('about', 'resize-y leading-relaxed')} p-3.5`}
                      />
                      {renderFieldError('about')}

                      {/* Prompt suggestion chips */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                        <span className="text-[11px] text-slate-400 font-medium">Helpful prompts:</span>
                        {['Core Mission & Product', 'Market Impact', 'Team Culture & Values', 'Growth Trajectory'].map((tag) => (
                          <span key={tag} className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                            💡 {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Bottom Actions Bar ── */}
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save Progress</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_4px_rgba(255,112,67,0.3)] hover:shadow-[0_4px_8px_rgba(255,112,67,0.35)] transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save & Continue to Step 2: Products & Business Model →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* 2. SECTION 2: PRODUCTS & BUSINESS MODEL                           */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'business_model' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5 animate-in fade-in duration-150">
                <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#FF7043]" />
                      Products & Commercial Business Model
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Offerings, revenue mechanics, deal metrics, and market channels</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product or Service Name(s)</label>
                    <input
                      type="text"
                      value={bm.product_name || ''}
                      onChange={(e) => updateJsonField('business_model_data', 'product_name', e.target.value)}
                      placeholder="e.g. CloudNest Suite, Uptrix Portal"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Model *</label>
                    <select
                      id="field-customer_model"
                      name="customer_model"
                      value={bm.customer_model || ''}
                      onChange={(e) => updateJsonField('business_model_data', 'customer_model', e.target.value)}
                      className={getSelectClassName('customer_model')}
                    >
                      <option value="">Select customer model...</option>
                      {CUSTOMER_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {renderFieldError('customer_model')}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Core Offering Description *</label>
                  <textarea
                    id="field-offering_description"
                    name="offering_description"
                    rows="3"
                    value={bm.offering_description || ''}
                    onChange={(e) => updateJsonField('business_model_data', 'offering_description', e.target.value)}
                    placeholder="Explains what the business sells in simple terms to help candidates understand the value..."
                    className={getInputClassName('offering_description', 'resize-y')}
                  />
                  {renderFieldError('offering_description')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Revenue Model *</label>
                      <RevenueModelHelpTooltip align="left" />
                    </div>
                    <select
                      id="field-revenue_model"
                      name="revenue_model"
                      value={bm.revenue_model || ''}
                      onChange={(e) => updateJsonField('business_model_data', 'revenue_model', e.target.value)}
                      className={getSelectClassName('revenue_model')}
                    >
                      <option value="">Select revenue model...</option>
                      {REVENUE_MODELS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {renderFieldError('revenue_model')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Typical Buying Cycle</label>
                    <select
                      value={bm.buying_cycle || ''}
                      onChange={(e) => updateJsonField('business_model_data', 'buying_cycle', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="">Select buying cycle...</option>
                      {BUYING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* ACV Deal Size */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency</label>
                    <select
                      value={bm.purchase_value_currency || 'INR'}
                      onChange={(e) => updateJsonField('business_model_data', 'purchase_value_currency', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Typical ACV / Deal Value</label>
                    <input
                      type="text"
                      value={bm.purchase_value_range || ''}
                      onChange={(e) => updateJsonField('business_model_data', 'purchase_value_range', e.target.value)}
                      placeholder="e.g. ₹50,000 – ₹2,00,000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Billing Basis</label>
                    <select
                      value={bm.purchase_value_basis || 'Annual'}
                      onChange={(e) => updateJsonField('business_model_data', 'purchase_value_basis', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="Annual">Annual</option>
                      <option value="Monthly">Monthly</option>
                      <option value="One-time">One-time</option>
                      <option value="Project-based">Project-based</option>
                    </select>
                  </div>
                </div>

                {/* Route to market chips */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Route to Market (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROUTES_TO_MARKET.map(item => {
                      const isSelected = Array.isArray(bm.route_to_market) && bm.route_to_market.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleJsonArrayItem('business_model_data', 'route_to_market', item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Key Competitors</label>
                  <input
                    type="text"
                    value={bm.competitors || ''}
                    onChange={(e) => updateJsonField('business_model_data', 'competitors', e.target.value)}
                    placeholder="e.g. CompetitorA, CompetitorB, Legacy Excel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevTab}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>← Back to Step 1: Profile</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save Progress</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save & Continue to Step 3: Target Audience →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* 3. SECTION 3: TARGET AUDIENCE & BUYERS                            */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'target_audience' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5 animate-in fade-in duration-150">
                <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#FF7043]" />
                      Target Audience & Buyer Persona Intelligence
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Demographics, key customer segments, and decision triggers</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Geographic Markets *</label>
                    <input
                      type="text"
                      id="field-target_markets"
                      name="target_markets"
                      value={ta.target_markets || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'target_markets', e.target.value)}
                      placeholder="e.g. India, North America, Southeast Asia"
                      className={getInputClassName('target_markets')}
                    />
                    {renderFieldError('target_markets')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Market Scope *</label>
                    <select
                      id="field-market_scope"
                      name="market_scope"
                      value={ta.market_scope || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'market_scope', e.target.value)}
                      className={getSelectClassName('market_scope')}
                    >
                      <option value="">Select market scope...</option>
                      {MARKET_SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {renderFieldError('market_scope')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Customer Segment *</label>
                    <select
                      id="field-customer_segment"
                      name="customer_segment"
                      value={ta.customer_segment || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'customer_segment', e.target.value)}
                      className={getSelectClassName('customer_segment')}
                    >
                      <option value="">Select customer segment...</option>
                      {CUSTOMER_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {renderFieldError('customer_segment')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Languages</label>
                    <input
                      type="text"
                      value={ta.audience_languages || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'audience_languages', e.target.value)}
                      placeholder="e.g. English, Hindi, German"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Organisation Size</label>
                    <select
                      value={ta.customer_size || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'customer_size', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="">Select customer org size...</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Desired Market Positioning</label>
                    <select
                      value={ta.positioning || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'positioning', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="">Select positioning...</option>
                      {POSITIONING_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Typical Buyer / User Roles *</label>
                  <input
                    type="text"
                    id="field-buyer_roles"
                    name="buyer_roles"
                    value={ta.buyer_roles || ''}
                    onChange={(e) => updateJsonField('target_audience_data', 'buyer_roles', e.target.value)}
                    placeholder="e.g. VP Marketing, Head of Growth, CTO, Talent Acquisition Lead"
                    className={getInputClassName('buyer_roles')}
                  />
                  {renderFieldError('buyer_roles')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Core Problem Solved for Customers *</label>
                  <textarea
                    id="field-customer_problem"
                    name="customer_problem"
                    rows="3"
                    value={ta.customer_problem || ''}
                    onChange={(e) => updateJsonField('target_audience_data', 'customer_problem', e.target.value)}
                    placeholder="Describe what pain points the customer faces and how your product resolves them..."
                    className={getInputClassName('customer_problem', 'resize-y')}
                  />
                  {renderFieldError('customer_problem')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Why Customers Buy / Purchase Triggers</label>
                    <input
                      type="text"
                      value={ta.purchase_triggers || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'purchase_triggers', e.target.value)}
                      placeholder="e.g. Inefficient workflows, rapid scaling pains"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Common Buying Objections / Hesitation</label>
                    <input
                      type="text"
                      value={ta.buying_objections || ''}
                      onChange={(e) => updateJsonField('target_audience_data', 'buying_objections', e.target.value)}
                      placeholder="e.g. Budget constraints, implementation bandwidth"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevTab}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>← Back to Step 2: Business Model</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save Progress</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save & Continue to Step 4: Growth Stage →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* 4. SECTION 4: GROWTH STAGE & PRIORITIES                           */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'growth_stage' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5 animate-in fade-in duration-150">
                <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#FF7043]" />
                      Growth Stage & Strategic Priorities
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Scale phase, timeline planning, and operational milestones</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Stage *</label>
                    <select
                      id="field-business_stage"
                      name="business_stage"
                      value={gs.business_stage || ''}
                      onChange={(e) => updateJsonField('growth_stage_data', 'business_stage', e.target.value)}
                      className={getSelectClassName('business_stage')}
                    >
                      <option value="">Select stage...</option>
                      {BUSINESS_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {renderFieldError('business_stage')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Marketing Maturity</label>
                    <select
                      value={gs.marketing_maturity || ''}
                      onChange={(e) => updateJsonField('growth_stage_data', 'marketing_maturity', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="">Select maturity...</option>
                      {MARKETING_MATURITIES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Planning Horizon</label>
                    <select
                      value={gs.planning_horizon || ''}
                      onChange={(e) => updateJsonField('growth_stage_data', 'planning_horizon', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="">Select horizon...</option>
                      {PLANNING_HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                {/* Top 3 Priorities Multi-Select */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Top 3 Business Priorities * (Pick up to 3)
                    </label>
                    <span className="text-[11px] font-bold text-indigo-600">
                      {Array.isArray(gs.business_priorities) ? gs.business_priorities.length : 0} / 3 selected
                    </span>
                  </div>
                  <div
                    id="field-business_priorities"
                    className={`p-3 rounded-2xl transition-all ${
                      validationErrors.business_priorities
                        ? 'border border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {BUSINESS_PRIORITY_OPTIONS.map(opt => {
                        const isSelected = Array.isArray(gs.business_priorities) && gs.business_priorities.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleJsonArrayItem('growth_stage_data', 'business_priorities', opt, 3)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-[#FF7043] text-white border-[#FF7043] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {renderFieldError('business_priorities')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Biggest Current Marketing / Growth Challenge *
                  </label>
                  <input
                    type="text"
                    id="field-marketing_challenge"
                    name="marketing_challenge"
                    value={gs.marketing_challenge || ''}
                    onChange={(e) => updateJsonField('growth_stage_data', 'marketing_challenge', e.target.value)}
                    placeholder="e.g. Lead volume is rising, but qualified sales pipeline remains inconsistent"
                    className={getInputClassName('marketing_challenge')}
                  />
                  {renderFieldError('marketing_challenge')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Desired Business Outcomes from Marketing & Hiring
                  </label>
                  <textarea
                    rows="3"
                    value={gs.desired_outcomes || ''}
                    onChange={(e) => updateJsonField('growth_stage_data', 'desired_outcomes', e.target.value)}
                    placeholder="e.g. Build a repeatable outbound demand generation engine and lift opportunity conversion quality by 25%"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none resize-y"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevTab}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>← Back to Step 3: Target Audience</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save Progress</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save & Continue to Step 5: Team & Tools →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* 5. SECTION 5: TEAM, CAPABILITIES & TOOLS                          */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'marketing_team' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5 animate-in fade-in duration-150">
                <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#FF7043]" />
                      Team Structure, Capabilities & Tools
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Headcount, functional ownership, budget, and marketing tech stack</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Marketing Team Size Today *</label>
                    <select
                      id="field-team_size"
                      name="team_size"
                      value={mt.team_size || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'team_size', e.target.value)}
                      className={getSelectClassName('team_size')}
                    >
                      <option value="">Select team size...</option>
                      {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {renderFieldError('team_size')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leadership Structure *</label>
                    <select
                      id="field-leadership_structure"
                      name="leadership_structure"
                      value={mt.leadership_structure || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'leadership_structure', e.target.value)}
                      className={getSelectClassName('leadership_structure')}
                    >
                      <option value="">Select leadership structure...</option>
                      {LEADERSHIP_STRUCTURES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {renderFieldError('leadership_structure')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Capability Ownership</label>
                    <select
                      value={mt.capability_ownership || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'capability_ownership', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="">Select delivery model...</option>
                      {['In-house team', 'External Agency', 'Freelancers / Contractors', 'Founder-led', 'Unassigned / Hybrid'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Budget Range</label>
                    <input
                      type="text"
                      value={mt.monthly_budget_range || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'monthly_budget_range', e.target.value)}
                      placeholder="e.g. ₹5–15 Lakh / mo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                {/* Existing Capabilities Chips */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Existing Capabilities (Check all currently in place)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CAPABILITY_OPTIONS.map(c => {
                      const isSelected = Array.isArray(mt.capabilities) && mt.capabilities.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleJsonArrayItem('marketing_team_data', 'capabilities', c)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#5C59E8] text-white border-[#5C59E8] shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active channels & Tools used */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Active Channels</label>
                    <input
                      type="text"
                      value={mt.active_channels || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'active_channels', e.target.value)}
                      placeholder="e.g. Google Search Ads, LinkedIn Organic, Cold Email"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Core Tools & Tech Stack</label>
                    <input
                      type="text"
                      value={mt.tools_used || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'tools_used', e.target.value)}
                      placeholder="e.g. HubSpot, Google Analytics 4, Figma, SEMrush"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Performance Measurement Maturity</label>
                    <select
                      value={mt.measurement_maturity || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'measurement_maturity', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] outline-none"
                    >
                      <option value="">Select maturity...</option>
                      {['None / Ad-hoc', 'Basic (traffic & leads)', 'Moderate (funnel conversion tracking)', 'Advanced (attribution & cohort LTV)'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Decision-Making Authority</label>
                    <input
                      type="text"
                      value={mt.decision_authority || ''}
                      onChange={(e) => updateJsonField('marketing_team_data', 'decision_authority', e.target.value)}
                      placeholder="e.g. Founder / CEO, CMO, Head of Growth"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevTab}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>← Back to Step 4: Growth Stage</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save Progress</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save & Continue to Step 6: Hiring Defaults →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* 6. SECTION 6: HIRING DEFAULTS & SMART CASCADE                     */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'hiring_defaults' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5 animate-in fade-in duration-150">
                <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#FF7043]" />
                      Hiring Defaults & Smart Job Cascade
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Universal defaults automatically populated into new Post Job listings</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                  <p className="text-[11px] text-indigo-900 font-semibold leading-relaxed">
                    ⚡ <strong>Smart Cascade Note:</strong> Defaults configured here automatically populate the Post Job wizard. When posting a job, workplace models, timezone overlap, and benefits packages are pre-filled instantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workplace / Location Model *</label>
                    <select
                      id="field-workplace_model"
                      name="workplace_model"
                      value={hd.workplace_model || 'Remote-First'}
                      onChange={(e) => updateJsonField('hiring_defaults_data', 'workplace_model', e.target.value)}
                      className={getSelectClassName('workplace_model')}
                    >
                      {WORKPLACE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {renderFieldError('workplace_model')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Working Hours & Timezone Overlap</label>
                    <input
                      type="text"
                      value={hd.working_hours_timezone || ''}
                      onChange={(e) => updateJsonField('hiring_defaults_data', 'working_hours_timezone', e.target.value)}
                      placeholder="e.g. 10:00 AM – 7:00 PM IST, 4 hours overlap with EST"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                {/* Standard Employment Types */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Standard Employment Types Offered *
                  </label>
                  <div
                    id="field-employment_types"
                    className={`p-3 rounded-2xl transition-all ${
                      validationErrors.employment_types
                        ? 'border border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {EMPLOYMENT_TYPES_OPTIONS.map(t => {
                        const isSelected = Array.isArray(hd.employment_types) && hd.employment_types.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleJsonArrayItem('hiring_defaults_data', 'employment_types', t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {renderFieldError('employment_types')}
                </div>

                {/* Standard Benefits & Perks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Standard Benefits & Perks (Auto-checked in Post Job)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STANDARD_BENEFITS.map(b => {
                      const isSelected = Array.isArray(hd.benefits_perks) && hd.benefits_perks.includes(b);
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => toggleJsonArrayItem('hiring_defaults_data', 'benefits_perks', b)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{b}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Culture Pitch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    "Why Join Us" Elevator Pitch
                  </label>
                  <textarea
                    rows="3"
                    value={hd.why_join_us || ''}
                    onChange={(e) => updateJsonField('hiring_defaults_data', 'why_join_us', e.target.value)}
                    placeholder="An elevator pitch summarizing your culture and team mission to attract high-caliber applicants..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Glassdoor / Review Link</label>
                    <input
                      type="url"
                      value={hd.employer_review_url || ''}
                      onChange={(e) => updateJsonField('hiring_defaults_data', 'employer_review_url', e.target.value)}
                      placeholder="https://glassdoor.com/Reviews/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Accessibility Contact / Note</label>
                    <input
                      type="text"
                      value={hd.accessibility_contact || ''}
                      onChange={(e) => updateJsonField('hiring_defaults_data', 'accessibility_contact', e.target.value)}
                      placeholder="e.g. accessibility@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevTab}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>← Back to Step 5: Team & Tools</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save Progress</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save & Continue to Step 7: Compliance Documents →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* 7. SECTION 7: COMPLIANCE & LEGAL DOCUMENTS                       */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'compliance_documents' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6">
                  {/* Header Banner */}
                  <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#FF7043]" />
                        Compliance & Legal Verification Documents
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Please provide <strong>any 2 documents</strong> of your choice from the 5 options below (upload photo/scan or enter ID number). The remaining 3 documents are optional.
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 border ${
                      validComplianceDocsCount >= 2
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                        : 'text-amber-700 bg-amber-50 border-amber-200/80'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {validComplianceDocsCount >= 2
                        ? `Requirements Met (${validComplianceDocsCount}/2 Provided)`
                        : `${validComplianceDocsCount}/2 Documents Provided (Need 2)`}
                    </span>
                  </div>

                  {/* Photo & Scan Capture Guidance Box */}
                  <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-start gap-3">
                    <Camera className="w-4 h-4 text-[#FF7043] shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">Choose Any 2 of 5 Documents:</strong>
                      <span className="text-slate-600 ml-1">
                        You can select and provide <strong>any 2 documents</strong> among Company PAN, Labour License, Trade License, Certificate of Incorporation (COI), or Registration Document (GST/MSME). You can take a live camera photo, upload a scanned document, or enter the official document number. Once any 2 documents are saved, this step is 100% complete!
                      </span>
                    </div>
                  </div>

                  {/* Validation Error Alert if < 2 documents */}
                  {validationErrors.compliance_documents && (
                    <div id="field-compliance_documents" className="p-4 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-900 text-xs flex items-center gap-3 animate-in fade-in">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-rose-950">Statutory Documents Required</h4>
                        <p className="mt-0.5 text-rose-800">{validationErrors.compliance_documents}</p>
                      </div>
                    </div>
                  )}

                  {/* 5 Statutory Documents List */}
                  <div className="space-y-5">
                    {COMPLIANCE_DOCUMENTS_CONFIG.map((doc, idx) => {
                      const docData = formData.compliance_documents_data?.[doc.key] || {};
                      const hasFile = Boolean(docData.file_url);
                      const isImage = hasFile && (/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(docData.file_url) || docData.file_url.startsWith('data:image'));

                      return (
                        <div
                          key={doc.key}
                          className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-4"
                        >
                          {/* Card Top Title Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                  {doc.title}
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${doc.badgeColor}`}>
                                    {doc.badge}
                                  </span>
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">{doc.desc}</p>
                              </div>
                            </div>

                            {hasFile ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-lg shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Photo Attached
                              </span>
                            ) : docData.doc_number ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/90 px-2.5 py-1 rounded-lg shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                                ID Number Saved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                                Optional Choice
                              </span>
                            )}
                          </div>

                          {/* Card Content: 2 Columns */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Left: Document Metadata Inputs */}
                            <div className="lg:col-span-5 space-y-3.5">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                  {doc.numberLabel}
                                </label>
                                <input
                                  type="text"
                                  value={docData.doc_number || ''}
                                  onChange={(e) => {
                                    const val = doc.key === 'pan_card' ? e.target.value.toUpperCase() : e.target.value;
                                    updateDocField(doc.key, 'doc_number', val);
                                  }}
                                  placeholder={doc.placeholder}
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                  Issuing Authority / Validity Notes (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={docData.validity_notes || ''}
                                  onChange={(e) => updateDocField(doc.key, 'validity_notes', e.target.value)}
                                  placeholder="e.g. Valid, Govt of India / Municipal Body"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white focus:border-[#5C59E8] outline-none"
                                />
                              </div>

                              {hasFile && docData.uploaded_at && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                                  <Clock className="w-3 h-3" />
                                  Attached on {new Date(docData.uploaded_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>

                            {/* Right: Photo Capture & Upload Box */}
                            <div className="lg:col-span-7">
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Document Photo / Scanned Copy (Optional if ID entered)
                              </label>

                              {/* Hidden file input with camera capture support */}
                              <input
                                type="file"
                                ref={el => fileInputRefs.current[doc.key] = el}
                                accept="image/*,application/pdf"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleComplianceDocUpload(doc.key, file);
                                  e.target.value = '';
                                }}
                              />

                              {hasFile ? (
                                <div className="space-y-3">
                                  {isImage ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-44 flex items-center justify-center">
                                      <img
                                        src={docData.file_url}
                                        alt={doc.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                                        onClick={() => setPreviewDocModal({ url: docData.file_url, title: doc.title, isImage: true })}
                                      />
                                      <div
                                        onClick={() => setPreviewDocModal({ url: docData.file_url, title: doc.title, isImage: true })}
                                        className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold cursor-pointer"
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span>Click to View Full Photo</span>
                                      </div>
                                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold shadow-xs flex items-center gap-1 backdrop-blur-xs">
                                        <Check className="w-3 h-3" /> Photo Attached
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-800 truncate">{docData.file_name || `${doc.shortTitle} Document`}</p>
                                          <p className="text-[11px] text-slate-400">PDF Document</p>
                                        </div>
                                      </div>
                                      <a
                                        href={docData.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#5C59E8] hover:bg-slate-50 flex items-center gap-1 shrink-0"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>View</span>
                                      </a>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-[11px] text-slate-500 truncate max-w-[220px]">
                                      📄 {docData.file_name || 'Attached file'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => fileInputRefs.current[doc.key]?.click()}
                                        disabled={uploadingDocKey === doc.key}
                                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                      >
                                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Retake / Replace Photo</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDoc(doc.key)}
                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                        title="Remove photo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => fileInputRefs.current[doc.key]?.click()}
                                  className="border-2 border-dashed border-slate-200 hover:border-[#FF7043] rounded-xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-orange-50/20 group flex flex-col items-center justify-center min-h-[140px]"
                                >
                                  {uploadingDocKey === doc.key ? (
                                    <div className="flex flex-col items-center gap-2 py-3">
                                      <Loader2 className="w-7 h-7 text-[#FF7043] animate-spin" />
                                      <span className="text-xs font-semibold text-slate-700">Uploading photo to AWS S3...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF7043] group-hover:bg-[#FF7043] group-hover:text-white transition-all flex items-center justify-center mb-2 shadow-2xs">
                                        <Camera className="w-5 h-5" />
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#FF7043] transition-colors">
                                        Take Photo / Upload {doc.shortTitle}
                                      </p>
                                      <p className="text-[11px] text-slate-400 mt-1">
                                        Capture via camera or select image/PDF (up to 10MB)
                                      </p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 7 Bottom Navigation Actions */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {validationErrors.compliance_documents ? (
                      <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            {validationErrors.compliance_documents}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md shrink-0">
                          Action Required
                        </span>
                      </div>
                    ) : validComplianceDocsCount < 2 ? (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Please provide at least <strong>2 documents</strong> (currently {validComplianceDocsCount}/2 provided). Enter ID numbers or upload photos/scans for any 2 documents to complete this step.
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md shrink-0">
                          {2 - validComplianceDocsCount} More Needed
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Statutory Document Requirement Met!</strong> You have provided {validComplianceDocsCount} of 5 documents (minimum 2 required). You can add more documents or submit your profile for Superadmin verification.
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handlePrevTab}
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <span>← Back to Step 6: Hiring Defaults</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading}
                          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5 text-slate-500" />
                          <span>Save Progress</span>
                        </button>

                        {comp.verification_status === 'UNDER_REVIEW' ? (
                          <div className="px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-800 text-xs font-semibold flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>Submitted & Under Inspect Review</span>
                          </div>
                        ) : (comp.is_verified || comp.verification_status === 'VERIFIED') ? (
                          <div className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified Organization & Active Free Trial</span>
                          </div>
                        ) : allTabsCompleted ? (
                          <button
                            type="button"
                            onClick={handleRequestVerification}
                            disabled={requestingVerification || loading}
                            className="px-5 py-2.5 rounded-xl bg-[#5C59E8] hover:bg-[#4E4AD6] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer border-none disabled:opacity-50"
                          >
                            {requestingVerification ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            <span>Submit Profile for Inspect Review & Unlock Free Trial</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async (e) => {
                              if (validComplianceDocsCount >= 2) {
                                setCompletedTabs(prev => new Set([...prev, 'compliance_documents']));
                              }
                              await handleSubmit(e);
                            }}
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer border-none disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Save Profile ({completedTabsCount}/7 Steps Complete)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </form>

      {/* Lightbox Modal for Photo Previews */}
      {previewDocModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewDocModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-5 shadow-2xl relative space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FF7043]" />
                {previewDocModal.title} - Document Photo
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Open original file in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[72vh] flex items-center justify-center overflow-auto rounded-xl bg-slate-900/5 p-2">
              <img
                src={previewDocModal.url}
                alt={previewDocModal.title}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
