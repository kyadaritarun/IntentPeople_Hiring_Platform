function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    const proto = window.location.protocol;
    // In production on intentpeople.com or any subdomain (e.g. apexrecruits.intentpeople.com)
    if (host === 'intentpeople.com' || host.endsWith('.intentpeople.com')) {
      return `${proto}//backend.intentpeople.com/api`;
    }
  }

  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '') + '/api';
  }

  return '/api';
}

const API_BASE = getApiBaseUrl();

function getAuthHeaders() {
  const token = localStorage.getItem('uptrix_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Handle error message array or string
    let msg = data.detail || 'An unexpected error occurred';
    if (Array.isArray(data.detail)) {
      msg = data.detail.map(err => err.msg || err).join(', ');
    }
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // Auth
  async registerCandidate(formData) {
    const res = await fetch(`${API_BASE}/auth/register/candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return handleResponse(res);
  },

  async registerCompany(formData) {
    const res = await fetch(`${API_BASE}/auth/register/company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return handleResponse(res);
  },

  async verifyOTP(email, otpCode) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp_code: otpCode })
    });
    return handleResponse(res);
  },

  async resendOTP(email) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async resetPassword(payload) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async googleLogin({ email, name, role = 'CANDIDATE' }) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Profiles
  async getCandidateProfile() {
    const res = await fetch(`${API_BASE}/candidates/me`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async updateCandidateProfile(data) {
    const res = await fetch(`${API_BASE}/candidates/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateCompanyProfile(data) {
    const res = await fetch(`${API_BASE}/companies/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateStaffProfile(data) {
    const res = await fetch(`${API_BASE}/companies/staff/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async uploadStaffPhoto(file) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/companies/staff/me/photo`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async uploadCompanyLogo(file) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/companies/logo`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async uploadCompanyComplianceDoc(file, docType) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (docType) {
      formData.append('doc_type', docType);
    }
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/companies/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async verifyCompany() {
    const res = await fetch(`${API_BASE}/companies/verify`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async requestCompanyVerification() {
    const res = await fetch(`${API_BASE}/companies/request-verification`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async uploadResume(file) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/candidates/resume`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async uploadCandidatePhoto(file) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/candidates/photo`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async uploadCandidateCover(file) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/candidates/cover`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  // Jobs
  async getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/jobs${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },

  async getJobById(jobId) {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`);
    return handleResponse(res);
  },

  async getMyJobs(groupId = null) {
    const url = groupId ? `${API_BASE}/jobs/my?group_id=${groupId}` : `${API_BASE}/jobs/my`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createJob(jobData) {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(jobData)
    });
    return handleResponse(res);
  },

  async updateJob(jobId, jobData) {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(jobData)
    });
    return handleResponse(res);
  },

  async updateJobStatus(jobId, status) {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Saved Jobs (Bookmarks)
  async getSavedJobs() {
    const res = await fetch(`${API_BASE}/jobs/saved`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async saveJob(jobId) {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async unsaveJob(jobId) {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/save`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Applications
  async applyJob(jobId, coverLetter, screeningAnswers = []) {
    const payload = (typeof coverLetter === 'object' && coverLetter !== null)
      ? coverLetter
      : { cover_letter: coverLetter || '', screening_answers: screeningAnswers || [] };

    let res = await fetch(`${API_BASE}/applications/job/${jobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
    }
    return handleResponse(res);
  },

  async getMyApplications() {
    const res = await fetch(`${API_BASE}/applications/my`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getJobApplicants(jobId) {
    const res = await fetch(`${API_BASE}/applications/job/${jobId}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getCompanyApplications(groupId = null) {
    const url = groupId ? `${API_BASE}/applications/company/all?group_id=${groupId}` : `${API_BASE}/applications/company/all`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async updateApplicationStatus(appId, status) {
    const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Support & Notifications
  async createSupportTicket(ticketData) {
    const res = await fetch(`${API_BASE}/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(ticketData)
    });
    return handleResponse(res);
  },

  async getSupportTickets() {
    const res = await fetch(`${API_BASE}/support/tickets`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async clearNotifications() {
    const res = await fetch(`${API_BASE}/notifications/clear`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async deleteNotification(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Team Management (Administrator)
  async getTeamMembers(includeAdmin = false) {
    const query = includeAdmin ? '?include_admin=true' : '';
    const res = await fetch(`${API_BASE}/companies/team${query}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createTeamMember(memberData) {
    const res = await fetch(`${API_BASE}/companies/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(memberData)
    });
    return handleResponse(res);
  },

  async uploadStaffPhoto(file) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/companies/team/photo`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async updateTeamMember(memberId, memberData) {
    const res = await fetch(`${API_BASE}/companies/team/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(memberData)
    });
    return handleResponse(res);
  },

  async deleteTeamMember(memberId) {
    const res = await fetch(`${API_BASE}/companies/team/${memberId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Staff Groups & Pods Management (Administrator)
  async getStaffGroups() {
    const res = await fetch(`${API_BASE}/companies/groups`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createStaffGroup(groupData) {
    const res = await fetch(`${API_BASE}/companies/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(groupData)
    });
    return handleResponse(res);
  },

  async updateStaffGroup(groupId, groupData) {
    const res = await fetch(`${API_BASE}/companies/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(groupData)
    });
    return handleResponse(res);
  },

  async deleteStaffGroup(groupId) {
    const res = await fetch(`${API_BASE}/companies/groups/${groupId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async addStaffGroupMembers(groupId, memberIds) {
    const res = await fetch(`${API_BASE}/companies/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ member_ids: memberIds })
    });
    return handleResponse(res);
  },

  async removeStaffGroupMember(groupId, memberId) {
    const res = await fetch(`${API_BASE}/companies/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Staff KYC & Compliance Documents
  async getStaffDocuments(memberId = null) {
    const query = memberId ? `?member_id=${memberId}` : '';
    const res = await fetch(`${API_BASE}/companies/staff-documents${query}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async uploadStaffDocument(formData) {
    const token = localStorage.getItem('uptrix_token');
    const res = await fetch(`${API_BASE}/companies/staff-documents`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async updateStaffDocumentStatus(documentId, status, notes = '') {
    const res = await fetch(`${API_BASE}/companies/staff-documents/${documentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, notes })
    });
    return handleResponse(res);
  },

  async deleteStaffDocument(documentId) {
    const res = await fetch(`${API_BASE}/companies/staff-documents/${documentId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // ── Interviews (Server-Persisted) ─────────────────────────────────
  async getInterviews() {
    const res = await fetch(`${API_BASE}/interviews`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createInterview(data) {
    const res = await fetch(`${API_BASE}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateInterview(interviewId, data) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteInterview(interviewId) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // ── Official Google Meet & OAuth 2.0 ──────────────────────────────
  async createGoogleMeet(interviewId) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/google-meet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getGoogleOAuthStatus() {
    const res = await fetch(`${API_BASE}/auth/google/status`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getGoogleOAuthUrl() {
    const res = await fetch(`${API_BASE}/auth/google/authorize`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async disconnectGoogleOAuth() {
    const res = await fetch(`${API_BASE}/auth/google/disconnect`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // ── Internal Staff Messages (Strictly Isolated by Company) ────────
  async getInternalMessages(channel = 'team-sync') {
    const query = channel ? `?channel=${encodeURIComponent(channel)}` : '';
    const res = await fetch(`${API_BASE}/messages${query}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async sendInternalMessage(data) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async uploadMessageAttachment(file) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = getAuthHeaders();
    delete headers['Content-Type'];
    const res = await fetch(`${API_BASE}/messages/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res);
  },

  // ── Candidate Community Posts ───────────────────────────────────
  async getMyPosts() {
    const res = await fetch(`${API_BASE}/posts/my`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getCommunityPosts(limit = 50) {
    const res = await fetch(`${API_BASE}/posts/?limit=${limit}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createPost(postData) {
    const res = await fetch(`${API_BASE}/posts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(postData)
    });
    return handleResponse(res);
  },

  async deletePost(postId) {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async updatePost(postId, data) {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async likePost(postId) {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async uploadPostImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('uptrix_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts/upload-image`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res);
  },

  async addPostComment(postId, content) {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ content })
    });
    return handleResponse(res);
  },

  async deletePostComment(postId, commentId) {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // ── AI Candidate Ranking ──────────────────────────────────────────
  async getTopCandidates(jobId, count = 10) {
    const res = await fetch(`${API_BASE}/applications/job/${jobId}/top?count=${count}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async rescoreJob(jobId) {
    const res = await fetch(`${API_BASE}/applications/job/${jobId}/rescore`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // ── Candidate Search & Sourcing (Recruiter) ────────────────────────
  async searchCandidates(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.skills) query.append('skills', params.skills);
    if (params.min_experience !== undefined && params.min_experience !== null && params.min_experience !== '') {
      query.append('min_experience', params.min_experience);
    }
    if (params.max_experience !== undefined && params.max_experience !== null && params.max_experience !== '') {
      query.append('max_experience', params.max_experience);
    }
    if (params.city) query.append('city', params.city);
    if (params.work_mode) query.append('work_mode', params.work_mode);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const url = `${API_BASE}/candidates/search${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getCandidateById(candidateId) {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async recordCandidateView(candidateId) {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/view`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async recordCandidateTopSearch(candidateId) {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/top-search`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // ── Official Google Meet API Integration ──────────────────────────
  async getGoogleOAuthStatus() {
    const res = await fetch(`${API_BASE}/auth/google/status`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getGoogleOAuthUrl() {
    const res = await fetch(`${API_BASE}/auth/google/authorize`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async disconnectGoogleOAuth() {
    const res = await fetch(`${API_BASE}/auth/google/disconnect`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createGoogleMeet(interviewId) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/google-meet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async generateGoogleMeetSpace() {
    const res = await fetch(`${API_BASE}/interviews/spaces/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // ── Subscription Plans & Razorpay Payments ────────────────────────
  async getSubscriptionPlans() {
    const res = await fetch(`${API_BASE}/payments/plans`);
    return handleResponse(res);
  },

  async getCurrentSubscription() {
    const res = await fetch(`${API_BASE}/payments/current`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async activateFreePlan() {
    const res = await fetch(`${API_BASE}/payments/activate-free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createRazorpayOrder(planId) {
    const res = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ plan_id: planId })
    });
    return handleResponse(res);
  },

  async verifyRazorpayPayment(paymentData) {
    const res = await fetch(`${API_BASE}/payments/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(paymentData)
    });
    return handleResponse(res);
  },

  // ── Superadmin Master Management ─────────────────────────────────────
  async superadminLogin(email, password) {
    const res = await fetch(`${API_BASE}/superadmin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async seedSuperadmin() {
    const res = await fetch(`${API_BASE}/superadmin/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  async getSuperadminStats() {
    const res = await fetch(`${API_BASE}/superadmin/stats`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getSuperadminCompanies(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.plan_type) query.append('plan_type', params.plan_type);
    if (params.plan_status) query.append('plan_status', params.plan_status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/superadmin/companies${qs}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async updateCompanyPlan(companyId, data) {
    const res = await fetch(`${API_BASE}/superadmin/companies/${companyId}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async toggleCompanyVerification(companyId, { is_verified, verification_status }) {
    const res = await fetch(`${API_BASE}/superadmin/companies/${companyId}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ is_verified, verification_status })
    });
    return handleResponse(res);
  },

  async getSuperadminVerificationRequests(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.q) query.append('q', params.q);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/superadmin/verification-requests${qs}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async approveCompanyVerification(companyId) {
    const res = await fetch(`${API_BASE}/superadmin/companies/${companyId}/approve-verification`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async rejectCompanyVerification(companyId, reason = '') {
    const res = await fetch(`${API_BASE}/superadmin/companies/${companyId}/reject-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  async toggleCompanyStatus(companyId, isActive, reason = '') {
    const res = await fetch(`${API_BASE}/superadmin/companies/${companyId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ is_active: isActive, reason })
    });
    return handleResponse(res);
  },

  async getSuperadminCandidates(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/superadmin/candidates${qs}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async toggleCandidateVerification(candidateId, is_verified) {
    const res = await fetch(`${API_BASE}/superadmin/candidates/${candidateId}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ is_verified })
    });
    return handleResponse(res);
  },

  async getSuperadminRecruiters(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/superadmin/recruiters${qs}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getSuperadminPayments(params = {}) {
    const query = new URLSearchParams();
    if (params.status_filter) query.append('status_filter', params.status_filter);
    if (params.plan_id) query.append('plan_id', params.plan_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/superadmin/payments${qs}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getSuperadminPlanConfigs() {
    const res = await fetch(`${API_BASE}/superadmin/plans`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async updateSuperadminPlanConfig(planId, data) {
    const res = await fetch(`${API_BASE}/superadmin/plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Superadmin Vendor Onboarding & Custom Portals
  async getSuperadminVendorInvitations(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.status_filter) query.append('status_filter', params.status_filter);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/superadmin/vendor-invitations${qs}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createSuperadminVendorInvitation(data) {
    const res = await fetch(`${API_BASE}/superadmin/vendor-invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async resendSuperadminVendorInvitation(invitationId) {
    const res = await fetch(`${API_BASE}/superadmin/vendor-invitations/${invitationId}/resend`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async simulateSuperadminVendorPayment(invitationId) {
    const res = await fetch(`${API_BASE}/superadmin/vendor-invitations/${invitationId}/simulate-payment`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async revokeSuperadminVendorInvitation(invitationId) {
    const res = await fetch(`${API_BASE}/superadmin/vendor-invitations/${invitationId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Public Vendor Payment & Tenant APIs
  async verifyVendorPaymentToken(token) {
    const res = await fetch(`${API_BASE}/vendor-invitations/verify/${token}`);
    return handleResponse(res);
  },

  async createVendorCheckoutOrder(token) {
    const res = await fetch(`${API_BASE}/vendor-invitations/checkout/create-order/${token}`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async completeVendorCheckout(token, paymentData = {}) {
    const res = await fetch(`${API_BASE}/vendor-invitations/checkout/complete/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return handleResponse(res);
  },

  async getVendorTenantDetails(subdomain) {
    const res = await fetch(`${API_BASE}/vendor-invitations/tenant/${subdomain}`);
    return handleResponse(res);
  }
};


