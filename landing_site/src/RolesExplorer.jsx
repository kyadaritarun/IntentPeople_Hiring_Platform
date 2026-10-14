import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  CheckSquare,
  Square,
  Briefcase,
  Users,
  X,
  Filter,
  Check,
  ChevronDown
} from "lucide-react";
import {
  DUMMY_JOBS,
  DUMMY_CANDIDATES,
  DIGITAL_MARKETING_CATEGORIES
} from "./rolesData";

export default function RolesExplorer({
  isDropdown = false,
  compact = false,
  onClose = null,
  onApplyJob = null,
  onHireCandidate = null,
  onViewAllClick = null
}) {
  // 2 Checkbox Modes: 'candidate' or 'recruiter'
  const [activeMode, setActiveMode] = useState("candidate"); // 'candidate' or 'recruiter'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setFilterDropdownOpen(false);
      }
    };
    if (filterDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [filterDropdownOpen]);

  // Filtered Jobs for Candidate mode
  const filteredJobs = useMemo(() => {
    return DUMMY_JOBS.filter((job) => {
      // Category match
      if (selectedCategory !== "ALL" && job.category !== selectedCategory) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesRole = job.roleTag.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesLocation = job.location.toLowerCase().includes(q);
        const matchesTags = job.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesRole && !matchesCompany && !matchesLocation && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Filtered Candidates for Recruiter mode
  const filteredCandidates = useMemo(() => {
    return DUMMY_CANDIDATES.filter((cand) => {
      // Category match
      if (selectedCategory !== "ALL" && cand.category !== selectedCategory) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cand.name.toLowerCase().includes(q);
        const matchesTitle = cand.title.toLowerCase().includes(q);
        const matchesRole = cand.roleTag.toLowerCase().includes(q);
        const matchesSkills = cand.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesTitle && !matchesRole && !matchesSkills) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
  };

  const handleJobClick = (job) => {
    if (onApplyJob) {
      onApplyJob(job);
    } else {
      const portalBase =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? (import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173')
          : 'https://portal.intentpeople.com';
      window.location.href = `${portalBase}/login/candidate`;
    }
  };

  const handleCandidateClick = (cand) => {
    if (onHireCandidate) {
      onHireCandidate(cand);
    } else {
      const portalBase =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? (import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173')
          : 'https://portal.intentpeople.com';
      window.location.href = `${portalBase}/login/recruiter`;
    }
  };


  return (
    <div className={`w-full bg-white text-slate-800 ${isDropdown ? "p-6 md:p-8" : "p-0"}`}>
      {/* ============================================================
           TOP ROW: I AM A (CANDIDATE & RECRUITER CHECKBOXES)
           ============================================================ */}
      <div className={`flex items-center justify-between gap-3 ${compact ? "pb-2.5" : "pb-4"} border-b border-slate-100`}>
        <div className="flex items-center gap-2.5 select-none flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            I AM A:
          </span>

          {/* Checkbox 1: Candidate */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMode("candidate");
            }}
            className={`flex items-center gap-1.5 ${compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-xs"} rounded-xl font-bold transition-all cursor-pointer border ${
              activeMode === "candidate"
                ? "bg-teal-50 border-teal-300 text-teal-900 shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {activeMode === "candidate" ? (
              <CheckSquare size={15} className="text-[#00A884]" />
            ) : (
              <Square size={15} className="text-slate-400" />
            )}
            <span>Candidate (Browse Jobs)</span>
          </button>

          {/* Checkbox 2: Recruiter */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMode("recruiter");
            }}
            className={`flex items-center gap-1.5 ${compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-xs"} rounded-xl font-bold transition-all cursor-pointer border ${
              activeMode === "recruiter"
                ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {activeMode === "recruiter" ? (
              <CheckSquare size={15} className="text-indigo-600" />
            ) : (
              <Square size={15} className="text-slate-400" />
            )}
            <span>Recruiter (Browse Talent)</span>
          </button>
        </div>

        {isDropdown && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ============================================================
           SEARCH BAR & FILTER DROPDOWN (BESIDE SEARCH BAR)
           ============================================================ */}
      <div className={`${compact ? "pt-2.5 pb-2.5" : "pt-4 pb-4"} border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5`}>
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeMode === "candidate"
                ? "Search digital marketing jobs by title or skill..."
                : "Search verified marketing talent by role or skill..."
            }
            className={`w-full pl-9 pr-8 ${compact ? "py-1.5 text-xs" : "py-2.5 text-xs sm:text-sm"} rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-600 focus:outline-none text-slate-800 placeholder-slate-400 transition-colors`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchQuery("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdown (Beside Search Bar) */}
        <div className="relative flex-shrink-0" ref={filterDropdownRef}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFilterDropdownOpen((prev) => !prev);
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-between gap-2 ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-xs sm:text-sm"} rounded-xl border transition-colors cursor-pointer font-semibold shadow-2xs ${
              selectedCategory !== "ALL"
                ? activeMode === "candidate"
                  ? "bg-teal-50 border-teal-300 text-teal-900"
                  : "bg-indigo-50 border-indigo-300 text-indigo-900"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Filter
                size={14}
                className={
                  selectedCategory !== "ALL"
                    ? activeMode === "candidate"
                      ? "text-teal-600"
                    : "text-indigo-600"
                    : "text-slate-400"
                }
              />
              <span className="text-slate-400 font-normal">Filter:</span>
              <span className="text-slate-800 font-bold truncate max-w-[140px] sm:max-w-[180px]">
                {DIGITAL_MARKETING_CATEGORIES.find((c) => c.id === selectedCategory)?.label || "All Roles"}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                filterDropdownOpen
                  ? activeMode === "candidate"
                    ? "rotate-180 text-teal-600"
                    : "rotate-180 text-indigo-600"
                  : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {filterDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 p-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Filter by Specialization
                </span>
                {selectedCategory !== "ALL" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedCategory("ALL");
                      setFilterDropdownOpen(false);
                    }}
                    className="text-[10.5px] text-indigo-600 hover:underline border-none bg-transparent cursor-pointer p-0 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {DIGITAL_MARKETING_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedCategory(cat.id);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border-none text-left ${
                        isSelected
                          ? activeMode === "candidate"
                            ? "bg-teal-50 text-teal-900 font-bold"
                            : "bg-indigo-50 text-indigo-900 font-bold"
                          : "bg-transparent text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat.label}</span>
                      {isSelected && (
                        <Check
                          size={14}
                          className={
                            activeMode === "candidate"
                              ? "text-teal-600 stroke-[2.5]"
                              : "text-indigo-600 stroke-[2.5]"
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
           DYNAMIC RESULTS AREA: DUMMY JOBS OR DUMMY CANDIDATES
           ============================================================ */}
      <div className={compact ? "pt-2.5" : "pt-6"}>
        {/* Results Header */}
        <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-4"}`}>
          <div className="flex items-center gap-2">
            <h3 className={`font-serif ${compact ? "text-xs font-bold" : "text-base font-bold"} text-[#0F172A] m-0`}>
              {activeMode === "candidate"
                ? "Available Digital Marketing Jobs"
                : "Top 1% Pre-Vetted Candidates"}
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {activeMode === "candidate" ? filteredJobs.length : filteredCandidates.length} Found
            </span>
          </div>

          {(searchQuery || selectedCategory !== "ALL") && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleResetFilters();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer border-none bg-transparent"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* CANDIDATE MODE: DUMMY JOB TITLES */}
        {activeMode === "candidate" && (
          <div>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <Briefcase size={22} className="mx-auto text-slate-400 mb-1" />
                <p className="font-bold text-slate-700 text-xs">No digital marketing jobs matched your search.</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResetFilters();
                  }}
                  className="mt-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold cursor-pointer border-none"
                >
                  Show All Jobs
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 ${compact ? "max-h-[220px]" : "max-h-[48vh]"} overflow-y-auto pr-1`}>
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className={`${compact ? "p-2.5 px-3" : "p-3 px-3.5"} rounded-xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-xs active:scale-[0.99] transition-all flex items-center justify-between gap-3 cursor-pointer group`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <h4 className="font-medium text-xs sm:text-[13px] text-[#0F172A] group-hover:text-indigo-600 transition-colors leading-snug truncate m-0">
                        {job.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                      {job.type || "Full-Time"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECRUITER MODE: DUMMY CANDIDATE PROFILES */}
        {activeMode === "recruiter" && (
          <div>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <Users size={22} className="mx-auto text-slate-400 mb-1" />
                <p className="font-bold text-slate-700 text-xs">No verified candidates matched your search.</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResetFilters();
                  }}
                  className="mt-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold cursor-pointer border-none"
                >
                  Show All Candidates
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${compact ? "max-h-[210px]" : "max-h-[45vh]"} overflow-y-auto pr-1`}>
                {filteredCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => handleCandidateClick(cand)}
                    className={`${compact ? "p-2" : "p-3.5"} rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 hover:shadow-xs active:scale-[0.99] transition-all flex items-center justify-between gap-2 shadow-2xs cursor-pointer group`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {cand.avatar ? (
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-lg object-cover border border-slate-200 flex-shrink-0 shadow-2xs`}
                        />
                      ) : (
                        <div className={`${compact ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-[11px]"} rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors`}>
                          {cand.initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{cand.name}</span>
                          <span className="w-3 h-3 rounded-full bg-emerald-500 text-white text-[7px] font-bold flex items-center justify-center flex-shrink-0">
                            ✓
                          </span>
                        </div>
                        <h4 className="font-serif text-[10.5px] text-slate-500 truncate m-0 mt-0.5">
                          {cand.title}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                      {cand.location || "Remote"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
