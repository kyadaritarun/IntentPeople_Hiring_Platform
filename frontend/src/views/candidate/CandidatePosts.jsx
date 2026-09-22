import React, { useState, useEffect, useRef } from 'react';
import {
  Share2, Image as ImageIcon, Tag, Send, Trash2, Heart,
  MessageSquare, Eye, Plus, X, Check, Search,
  RefreshCw, FileText, Link as LinkIcon,
  Pencil, MoreHorizontal, TrendingUp, Zap
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function CandidatePosts({ setActiveTab }) {
  const { user } = useAuth();
  const profile = user?.profile || {};
  const userName = profile.full_name || user?.full_name || user?.email?.split('@')[0] || 'Candidate';
  const userTitle = (!profile.title || profile.title.toLowerCase().includes('digital marketing')) ? 'Candidate' : profile.title;
  const userAvatar = profile.avatar_url;

  // Posts State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  const FILTER_TABS = [
    { id: 'all', label: 'All Posts' },
    { id: 'mine', label: 'My Posts' },
    { id: 'recruiters', label: 'Companies & Recruiters' },
    { id: 'candidates', label: 'Candidates' }
  ];

  // Composer Modal State
  const [showComposer, setShowComposer] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedTags, setSelectedTags] = useState(['#OpenToWork']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [copiedPostId, setCopiedPostId] = useState(null);

  // Comment state
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingCommentId, setSubmittingCommentId] = useState(null);

  // Edit state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editingSubmitting, setEditingSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const composerTextareaRef = useRef(null);

  const SUGGESTED_TAGS = [
    '#OpenToWork', '#Marketing', '#React', '#SEO',
    '#PerformanceMarketing', '#Growth', '#WebDev', '#RemoteWork'
  ];

  const STARTER_PROMPTS = [
    {
      label: '🚀 Open to Work',
      text: `Excited to announce that I am actively exploring new opportunities in Digital Marketing & Performance Campaigns! Open to remote and hybrid roles where I can drive measurable pipeline growth. Let's connect! 🤝`
    },
    {
      label: '💡 Project Insight',
      text: `Key takeaway from my latest campaign optimization: Testing custom landing page headlines boosted conversion rates by 28% without increasing budget. Continuous testing always pays off! 📈`
    },
    {
      label: '🏆 Achievement',
      text: `Thrilled to have completed advanced certification in GA4 & Meta Ad Architecture. Always staying up-to-date with algorithmic changes to maximize ROAS. 🎯`
    }
  ];

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    if (showComposer) {
      setTimeout(() => composerTextareaRef.current?.focus(), 150);
    }
  }, [showComposer]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getCommunityPosts(60);
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      try {
        const cached = localStorage.getItem('uptrix_candidate_posts');
        if (cached) setPosts(JSON.parse(cached));
      } catch (err) { }
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalBackup = (updated) => {
    try { localStorage.setItem('uptrix_candidate_posts', JSON.stringify(updated)); } catch (e) { }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select a valid image file.'); return; }
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
  };

  const handleRemoveImage = () => {
    setSelectedFile(null); setImagePreview(''); setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleTag = (tag) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (selectedTags.includes(cleanTag)) {
      setSelectedTags(prev => prev.filter(t => t !== cleanTag));
    } else {
      if (selectedTags.length >= 6) { alert('Maximum 6 tags allowed.'); return; }
      setSelectedTags(prev => [...prev, cleanTag]);
    }
  };

  const handleAddCustomTag = (e) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim().replace(/^#+/, '');
    if (!trimmed) return;
    const formatted = `#${trimmed}`;
    if (!selectedTags.includes(formatted)) {
      if (selectedTags.length >= 6) { alert('Maximum 6 tags allowed.'); return; }
      setSelectedTags(prev => [...prev, formatted]);
    }
    setCustomTagInput('');
  };

  const resetComposer = () => {
    setPostContent(''); setSelectedTags(['#OpenToWork']);
    handleRemoveImage(); setShowUrlInput(false); setShowComposer(false);
  };

  const handlePublishPost = async (e) => {
    if (e) e.preventDefault();
    const contentTrimmed = postContent.trim();
    if (!contentTrimmed) { alert('Please write something for your post.'); return; }

    setSubmitting(true);
    let finalImageUrl = imageUrl.trim();

    if (selectedFile) {
      setUploadingImage(true);
      try {
        const uploadRes = await api.uploadPostImage(selectedFile);
        if (uploadRes?.image_url) finalImageUrl = uploadRes.image_url;
      } catch (err) { finalImageUrl = imagePreview; }
      finally { setUploadingImage(false); }
    }

    const payload = { content: contentTrimmed, tags: selectedTags, image_url: finalImageUrl || null };

    try {
      const created = await api.createPost(payload);
      const updatedList = [created, ...posts];
      setPosts(updatedList); saveToLocalBackup(updatedList); resetComposer();
    } catch (err) {
      const localPost = {
        id: Date.now(), user_id: user?.id, content: contentTrimmed, tags: selectedTags,
        image_url: finalImageUrl || imagePreview || null, likes_count: 0, views_count: 1,
        comments_count: 0, comments: [], created_at: new Date().toISOString(),
        author: { name: userName, avatar: userAvatar, title: userTitle, role: 'CANDIDATE' }
      };
      setPosts([localPost, ...posts]); saveToLocalBackup([localPost, ...posts]); resetComposer();
    } finally { setSubmitting(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const updated = posts.filter(p => p.id !== postId);
    setPosts(updated); saveToLocalBackup(updated);
    try { await api.deletePost(postId); } catch (err) { }
  };

  const handleOpenEdit = (post) => {
    setEditingPost(post); setEditContent(post.content || ''); setEditTags(post.tags || []);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    const contentTrimmed = editContent.trim();
    if (!contentTrimmed) { alert('Post content cannot be empty.'); return; }
    setEditingSubmitting(true);
    try {
      const updatedPost = await api.updatePost(editingPost.id, { content: contentTrimmed, tags: editTags });
      const updated = posts.map(p => p.id === editingPost.id ? updatedPost : p);
      setPosts(updated); saveToLocalBackup(updated); setEditingPost(null);
    } catch (err) {
      alert('Failed to update post: ' + (err.message || 'Unknown error'));
    } finally { setEditingSubmitting(false); }
  };

  const handleLike = async (post) => {
    const isLiked = likedPosts[post.id];
    setLikedPosts(prev => ({ ...prev, [post.id]: !isLiked }));
    const updated = posts.map(p => p.id === post.id ? {
      ...p, likes_count: isLiked ? Math.max(0, (p.likes_count || 1) - 1) : (p.likes_count || 0) + 1
    } : p);
    setPosts(updated); saveToLocalBackup(updated);
    if (!isLiked) { try { await api.likePost(post.id); } catch (e) { } }
  };

  const handleShare = (post) => {
    navigator.clipboard.writeText(window.location.origin + '/my-posts#' + post.id);
    setCopiedPostId(post.id); setTimeout(() => setCopiedPostId(null), 2500);
  };

  const handleAddComment = async (postId, e) => {
    if (e) e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;
    setSubmittingCommentId(postId);
    try {
      const newComment = await api.addPostComment(postId, commentText);
      const updated = posts.map(p => p.id === postId ? {
        ...p, comments_count: (p.comments_count || 0) + 1, comments: [...(p.comments || []), newComment]
      } : p);
      setPosts(updated); saveToLocalBackup(updated);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      const fallback = {
        id: Date.now(), post_id: postId, user_id: user?.id, content: commentText,
        created_at: new Date().toISOString(), author: { name: userName, avatar: userAvatar, role: user?.role || 'CANDIDATE' }
      };
      const updated = posts.map(p => p.id === postId ? {
        ...p, comments_count: (p.comments_count || 0) + 1, comments: [...(p.comments || []), fallback]
      } : p);
      setPosts(updated); saveToLocalBackup(updated);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } finally { setSubmittingCommentId(null); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    const updated = posts.map(p => p.id === postId ? {
      ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1),
      comments: (p.comments || []).filter(c => c.id !== commentId)
    } : p);
    setPosts(updated); saveToLocalBackup(updated);
    try { await api.deletePostComment(postId, commentId); } catch (e) { }
  };

  const filteredPosts = posts.filter(p => {
    if (filterMode === 'mine' && p.user_id !== user?.id) return false;
    if (filterMode === 'recruiters' && p.author?.role === 'CANDIDATE') return false;
    if (filterMode === 'candidates' && p.author?.role !== 'CANDIDATE') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.content?.toLowerCase().includes(q) ||
      p.author?.name?.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  const totalLikes = posts.reduce((acc, p) => acc + (p.likes_count || 0), 0);

  // ───────────── RENDER ─────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5 pb-12" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ═══ Header ═══ */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '4px 0 6px' }}>
          Community & Candidate Posts
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400, margin: 0 }}>
          View posts from recruiters, companies, and fellow candidates, or share your own milestones.
        </p>
      </div>

      {/* ═══ Quick Compose Trigger Bar ═══ */}
      <div
        onClick={() => setShowComposer(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
          background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
          cursor: 'pointer', transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #1E3155, #3b5998)',
          color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0
        }}>
          {userAvatar ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userName.charAt(0).toUpperCase()}
        </div>
        <span style={{ flex: 1, fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
          What's happening in your career? Share an update...
        </span>
        <button
          type="button"
          style={{
            padding: '9px 18px', background: 'linear-gradient(135deg, #1E3155, #2d4a7a)',
            color: '#fff', fontSize: '0.72rem', fontWeight: 700, border: 'none', borderRadius: 10,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(30,49,85,0.25)', transition: 'all 0.15s ease'
          }}
          onClick={(e) => { e.stopPropagation(); setShowComposer(true); }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Post
        </button>
      </div>

      {/* ═══ Filter Tabs & Search Strip ═══ */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '12px 16px', background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                background: filterMode === tab.id ? '#1E3155' : '#f1f5f9',
                color: filterMode === tab.id ? '#ffffff' : '#475569',
                boxShadow: filterMode === tab.id ? '0 2px 6px rgba(30,49,85,0.2)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search style={{ width: 14, height: 14, color: '#94a3b8', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" placeholder="Search posts or authors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              fontSize: '0.72rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
              outline: 'none', color: '#334155'
            }}
          />
        </div>
      </div>

      {/* ═══ Posts Feed ═══ */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
          <div style={{
            width: 28, height: 28, border: '2.5px solid #1E3155', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Loading posts...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ padding: '56px 24px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
          }}>
            <Share2 style={{ width: 28, height: 28, color: '#4f46e5' }} />
          </div>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {searchQuery ? 'No posts found' : 'No posts yet'}
          </h3>
          <p style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: 360, margin: '0 auto' }}>
            {searchQuery ? 'Try different keywords.' : 'Create your first post to build visibility with hiring teams!'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowComposer(true)}
              style={{
                marginTop: 16, padding: '10px 24px', background: 'linear-gradient(135deg, #1E3155, #2d4a7a)',
                color: '#fff', fontSize: '0.72rem', fontWeight: 700, border: 'none', borderRadius: 10,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <Plus style={{ width: 14, height: 14 }} /> Create Your First Post
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredPosts.map(post => {
            const isLiked = Boolean(likedPosts[post.id]);
            const isMyPost = post.user_id === user?.id;
            const comments = post.comments || [];
            const isCommentsOpen = activeCommentPostId === post.id;
            const postDate = post.created_at
              ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recently';

            return (
              <div key={post.id} id={String(post.id)} style={{
                background: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0',
                padding: '20px 22px', transition: 'box-shadow 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 13,
                      background: (post.author?.role === 'RECRUITER' || post.author?.role === 'HIRING_MANAGER')
                        ? 'linear-gradient(135deg, #065f46, #0f766e)'
                        : 'linear-gradient(135deg, #1E3155, #3b5998)',
                      color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0
                    }}>
                      {post.author?.avatar ? (
                        <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (post.author?.name || (isMyPost ? userName : 'Member')).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{post.author?.name || (isMyPost ? userName : 'Community Member')}</span>
                        {(post.author?.role === 'RECRUITER' || post.author?.role === 'HIRING_MANAGER') ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                            Company / Recruiter
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                            Candidate
                          </span>
                        )}
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>{postDate}</span>
                        {post.updated_at && post.updated_at !== post.created_at && (
                          <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontStyle: 'italic' }}>(edited)</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500, marginTop: 1 }}>
                        {post.author?.title || (isMyPost ? userTitle : 'Uptrix Member')}
                      </p>
                    </div>
                  </div>

                  {isMyPost && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button onClick={() => handleOpenEdit(post)} style={{
                        padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: '#94a3b8',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        title="Edit post"
                      >
                        <Pencil style={{ width: 15, height: 15 }} />
                      </button>
                      <button onClick={() => handleDeletePost(post.id)} style={{
                        padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: '#94a3b8',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        title="Delete post"
                      >
                        <Trash2 style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 14 }}>
                  {post.content}
                </div>

                {/* Image */}
                {post.image_url && (
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #f1f5f9', marginBottom: 14, maxHeight: 380 }}>
                    <img src={post.image_url} alt="Post" style={{ width: '100%', height: 'auto', maxHeight: 380, objectFit: 'contain' }} loading="lazy" />
                  </div>
                )}

                {/* Tags */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {post.tags.map((t, idx) => (
                      <span key={idx} onClick={() => setSearchQuery(t)} style={{
                        fontSize: '0.65rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff',
                        padding: '3px 10px', borderRadius: 7, cursor: 'pointer', border: '1px solid #e0e7ff',
                        transition: 'all 0.15s'
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Interaction Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: '0.72rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => handleLike(post)} style={{
                      display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, border: 'none', background: 'transparent',
                      cursor: 'pointer', color: isLiked ? '#e11d48' : '#64748b', transition: 'color 0.15s', fontSize: '0.72rem'
                    }}>
                      <Heart style={{ width: 16, height: 16, fill: isLiked ? '#e11d48' : 'none' }} /> {post.likes_count || 0}
                    </button>
                    <button onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, border: 'none', background: 'transparent',
                      cursor: 'pointer', color: isCommentsOpen ? '#4f46e5' : '#64748b', transition: 'color 0.15s', fontSize: '0.72rem'
                    }}>
                      <MessageSquare style={{ width: 16, height: 16 }} /> {post.comments_count || comments.length || 0}
                    </button>
                    <button onClick={() => handleShare(post)} style={{
                      display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, border: 'none', background: 'transparent',
                      cursor: 'pointer', color: copiedPostId === post.id ? '#059669' : '#64748b', transition: 'color 0.15s', fontSize: '0.72rem'
                    }}>
                      {copiedPostId === post.id ? <><Check style={{ width: 16, height: 16 }} /> Copied</> : <><Share2 style={{ width: 16, height: 16 }} /> Share</>}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye style={{ width: 12, height: 12 }} /> {post.views_count || 1}
                  </span>
                </div>

                {/* Comments */}
                {isCommentsOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                    <form onSubmit={(e) => handleAddComment(post.id, e)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 9, background: '#1E3155', color: '#fff',
                        fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>{userName.charAt(0).toUpperCase()}</div>
                      <input
                        type="text" placeholder="Write a comment..." value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        style={{
                          flex: 1, padding: '8px 14px', fontSize: '0.72rem', background: '#f8fafc', borderRadius: 10,
                          border: '1px solid #e2e8f0', outline: 'none', color: '#334155'
                        }}
                      />
                      <button type="submit" disabled={submittingCommentId === post.id || !(commentInputs[post.id] || '').trim()} style={{
                        padding: '8px 14px', background: '#1E3155', color: '#fff', fontWeight: 700, fontSize: '0.68rem',
                        border: 'none', borderRadius: 9, cursor: 'pointer', opacity: (submittingCommentId === post.id || !(commentInputs[post.id] || '').trim()) ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0
                      }}>
                        {submittingCommentId === post.id ? <RefreshCw style={{ width: 12, height: 12, animation: 'spin 0.8s linear infinite' }} /> : <Send style={{ width: 12, height: 12 }} />}
                        Reply
                      </button>
                    </form>
                    {comments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {comments.map(comment => {
                          const isMyComment = comment.user_id === user?.id;
                          const cDate = comment.created_at ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';
                          return (
                            <div key={comment.id} style={{
                              padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9',
                              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8
                            }}>
                              <div style={{ display: 'flex', gap: 9 }}>
                                <div style={{
                                  width: 26, height: 26, borderRadius: 7, background: '#e2e8f0', color: '#475569',
                                  fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  overflow: 'hidden', flexShrink: 0
                                }}>
                                  {comment.author?.avatar ? <img src={comment.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (comment.author?.name || 'M').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a' }}>{comment.author?.name || 'Member'}</span>
                                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>• {cDate}</span>
                                  </div>
                                  <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 3, lineHeight: 1.5 }}>{comment.content}</p>
                                </div>
                              </div>
                              {isMyComment && (
                                <button onClick={() => handleDeleteComment(post.id, comment.id)} style={{
                                  padding: 3, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', flexShrink: 0
                                }}><X style={{ width: 13, height: 13 }} /></button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', padding: 8, fontStyle: 'italic' }}>No comments yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ COMPOSE POST MODAL ═══════════ */}
      {showComposer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)'
        }} onClick={() => setShowComposer(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#ffffff', borderRadius: 22, maxWidth: 560, width: '100%', maxHeight: '88vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1E3155, #3b5998)',
                  color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {userAvatar ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Create Post</h3>
                  <p style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>
                    Posting as {userName} · Visible to everyone
                  </p>
                </div>
              </div>
              <button onClick={() => setShowComposer(false)} style={{
                padding: 8, borderRadius: 10, border: 'none', background: '#f1f5f9', color: '#64748b',
                cursor: 'pointer', transition: 'all 0.15s', display: 'flex'
              }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePublishPost} style={{ padding: '16px 24px 20px' }}>
              {/* Textarea */}
              <textarea
                ref={composerTextareaRef}
                rows={5}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="Share an achievement, campaign outcome, project update, or open-to-work note..."
                style={{
                  width: '100%', padding: 14, fontSize: '0.78rem', color: '#334155', border: '1.5px solid #e2e8f0',
                  borderRadius: 14, outline: 'none', resize: 'vertical', minHeight: 120, lineHeight: 1.7,
                  background: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#1E3155'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
              />

              {/* Quick Prompts */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4, lineHeight: '28px' }}>
                  Templates:
                </span>
                {STARTER_PROMPTS.map((p, i) => (
                  <button key={i} type="button" onClick={() => setPostContent(p.text)} style={{
                    fontSize: '0.65rem', fontWeight: 600, background: '#f1f5f9', color: '#475569',
                    padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s'
                  }}>{p.label}</button>
                ))}
              </div>

              {/* Tags Section */}
              <div style={{
                marginTop: 14, padding: 14, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag style={{ width: 14, height: 14, color: '#F2A93B' }} />
                    Tags & Topics ({selectedTags.length}/6)
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Click to toggle</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {SUGGESTED_TAGS.map(tag => {
                    const sel = selectedTags.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => handleToggleTag(tag)} style={{
                        fontSize: '0.65rem', padding: '5px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                        background: sel ? '#1E3155' : '#fff', color: sel ? '#fff' : '#475569',
                        border: sel ? '1px solid transparent' : '1px solid #e2e8f0',
                        boxShadow: sel ? '0 2px 6px rgba(30,49,85,0.2)' : 'none'
                      }}>
                        {sel && <Check style={{ width: 10, height: 10 }} />} {tag}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text" placeholder="Custom tag..." value={customTagInput} onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }}
                    style={{
                      flex: 1, padding: '6px 12px', fontSize: '0.68rem', background: '#fff', borderRadius: 8,
                      border: '1px solid #e2e8f0', outline: 'none', color: '#334155'
                    }}
                  />
                  <button type="button" onClick={handleAddCustomTag} style={{
                    padding: '6px 14px', background: '#e2e8f0', color: '#334155', fontSize: '0.68rem', fontWeight: 700,
                    borderRadius: 8, border: 'none', cursor: 'pointer'
                  }}>+ Add</button>
                </div>
              </div>

              {/* Image Preview */}
              {(imagePreview || imageUrl) && (
                <div style={{ position: 'relative', marginTop: 14, borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={imagePreview || imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
                  <button type="button" onClick={handleRemoveImage} style={{
                    position: 'absolute', top: 8, right: 8, padding: 5, borderRadius: '50%',
                    background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', cursor: 'pointer'
                  }}><X style={{ width: 14, height: 14 }} /></button>
                </div>
              )}

              {/* URL Input */}
              {showUrlInput && !imagePreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <LinkIcon style={{ width: 14, height: 14, color: '#94a3b8', flexShrink: 0 }} />
                  <input type="url" placeholder="Paste image URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    style={{ flex: 1, fontSize: '0.68rem', border: 'none', outline: 'none', background: 'transparent', color: '#334155' }} />
                  {imageUrl && <button type="button" onClick={() => setImagePreview(imageUrl)} style={{
                    padding: '4px 10px', background: '#4f46e5', color: '#fff', fontSize: '0.62rem', fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer'
                  }}>Preview</button>}
                </div>
              )}

              {/* Action Footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16,
                paddingTop: 14, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                    padding: '7px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff',
                    color: '#475569', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
                  }}>
                    <ImageIcon style={{ width: 14, height: 14, color: '#0ea5e9' }} /> Image
                  </button>
                  <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} style={{
                    padding: '7px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff',
                    color: '#475569', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
                  }}>
                    <LinkIcon style={{ width: 14, height: 14, color: '#10b981' }} /> Link
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{postContent.length} chars</span>
                  <button type="submit" disabled={!postContent.trim() || submitting || uploadingImage} style={{
                    padding: '10px 22px', background: (!postContent.trim() || submitting) ? '#94a3b8' : 'linear-gradient(135deg, #1E3155, #2d4a7a)',
                    color: '#fff', fontSize: '0.72rem', fontWeight: 700, border: 'none', borderRadius: 10,
                    cursor: (!postContent.trim() || submitting) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: (!postContent.trim() || submitting) ? 'none' : '0 4px 12px rgba(30,49,85,0.3)',
                    opacity: (!postContent.trim() || submitting) ? 0.5 : 1
                  }}>
                    {(submitting || uploadingImage) ? <><RefreshCw style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> Publishing...</> : <><Send style={{ width: 14, height: 14 }} /> Publish Post</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ EDIT POST MODAL ═══════════ */}
      {editingPost && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)'
        }} onClick={() => setEditingPost(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 22, maxWidth: 520, width: '100%', padding: '24px 28px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', position: 'relative'
          }}>
            <button onClick={() => setEditingPost(null)} style={{
              position: 'absolute', top: 16, right: 16, padding: 8, borderRadius: 10,
              border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer'
            }}><X style={{ width: 18, height: 18 }} /></button>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
              <Pencil style={{ width: 18, height: 18, color: '#4f46e5' }} /> Edit Post
            </h3>
            <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0 0 16px' }}>Only you can edit this post.</p>

            <textarea rows={5} value={editContent} onChange={e => setEditContent(e.target.value)} style={{
              width: '100%', padding: 14, fontSize: '0.78rem', color: '#334155', border: '1.5px solid #e2e8f0',
              borderRadius: 14, outline: 'none', resize: 'vertical', minHeight: 100, lineHeight: 1.7, background: '#f8fafc', boxSizing: 'border-box'
            }} />

            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Tag style={{ width: 14, height: 14, color: '#F2A93B' }} /> Tags
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {editTags.map((t, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.65rem', fontWeight: 600, background: '#eef2ff', color: '#4f46e5',
                    padding: '4px 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #e0e7ff'
                  }}>
                    {t}
                    <button type="button" onClick={() => setEditTags(editTags.filter((_, i) => i !== idx))} style={{
                      border: 'none', background: 'transparent', color: '#818cf8', cursor: 'pointer', padding: 0
                    }}><X style={{ width: 11, height: 11 }} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => setEditingPost(null)} style={{
                padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff',
                color: '#475569', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={editingSubmitting || !editContent.trim()} style={{
                padding: '9px 22px', borderRadius: 10, border: 'none', fontSize: '0.72rem', fontWeight: 700,
                cursor: (editingSubmitting || !editContent.trim()) ? 'not-allowed' : 'pointer',
                background: (editingSubmitting || !editContent.trim()) ? '#94a3b8' : 'linear-gradient(135deg, #1E3155, #2d4a7a)',
                color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 8px rgba(30,49,85,0.2)',
                opacity: (editingSubmitting || !editContent.trim()) ? 0.5 : 1
              }}>
                {editingSubmitting ? <><RefreshCw style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} /> Saving...</> : <><Check style={{ width: 13, height: 13 }} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
