import os

# Update RolesExplorer.jsx
path_roles = r'c:\Users\prana\OneDrive\Desktop\uptrix\uptrix_hiring_portal\landing_site\src\RolesExplorer.jsx'
with open(path_roles, 'r', encoding='utf-8') as f:
    text = f.read()

handlers_code = """  const handleJobClick = (job) => {
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
"""

target_insert = """  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
  };"""

replacement_insert = target_insert + "\n\n" + handlers_code

assert target_insert in text, "target_insert not found in RolesExplorer.jsx"
text = text.replace(target_insert, replacement_insert)

old_job_div = """                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`${compact ? "p-2.5 px-3" : "p-3 px-3.5"} rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <h4 className="font-medium text-xs sm:text-[13px] text-[#0F172A] group-hover:text-indigo-600 transition-colors leading-snug truncate m-0">
                        {job.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0">
                      {job.type || "Full-Time"}
                    </span>
                  </div>
                ))}"""

new_job_div = """                {filteredJobs.map((job) => (
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
                ))}"""

assert old_job_div in text, "old_job_div not found in RolesExplorer.jsx"
text = text.replace(old_job_div, new_job_div)

old_cand_div = """                {filteredCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className={`${compact ? "p-2" : "p-3.5"} rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all flex items-center justify-between gap-2 shadow-2xs`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {cand.avatar ? (
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-lg object-cover border border-slate-200 flex-shrink-0 shadow-2xs`}
                        />
                      ) : (
                        <div className={`${compact ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-[11px]"} rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0`}>
                          {cand.initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-slate-900 truncate">{cand.name}</span>
                          <span className="w-3 h-3 rounded-full bg-emerald-500 text-white text-[7px] font-bold flex items-center justify-center flex-shrink-0">
                            ✓
                          </span>
                        </div>
                        <h4 className="font-serif text-[10.5px] text-slate-500 truncate m-0 mt-0.5">
                          {cand.title}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0">
                      {cand.location || "Remote"}
                    </span>
                  </div>
                ))}"""

new_cand_div = """                {filteredCandidates.map((cand) => (
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
                ))}"""

assert old_cand_div in text, "old_cand_div not found in RolesExplorer.jsx"
text = text.replace(old_cand_div, new_cand_div)

with open(path_roles, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print("RolesExplorer.jsx updated successfully!")

# Also add onClick on the 3 hero cards in Landing.jsx
path_landing = r'c:\Users\prana\OneDrive\Desktop\uptrix\uptrix_hiring_portal\landing_site\src\Landing.jsx'
with open(path_landing, 'r', encoding='utf-8') as f:
    text_landing = f.read()

# Card 2
old_card2 = '<div\n                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-10 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer -rotate-[1deg]"'
new_card2 = '<div\n                    onClick={() => onNavigateToAuth ? onNavigateToAuth("login_recruiter") : null}\n                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-10 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer -rotate-[1deg]"'

if old_card2 in text_landing:
    text_landing = text_landing.replace(old_card2, new_card2)

# Card 1
old_card1 = '<div\n                    className="absolute bottom-2 left-0 sm:left-2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-20 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer -rotate-[6deg]"'
new_card1 = '<div\n                    onClick={() => onNavigateToAuth ? onNavigateToAuth("login_recruiter") : null}\n                    className="absolute bottom-2 left-0 sm:left-2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-20 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer -rotate-[6deg]"'

if old_card1 in text_landing:
    text_landing = text_landing.replace(old_card1, new_card1)

# Card 3
old_card3 = '<div\n                    className="absolute bottom-6 right-0 sm:right-2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-20 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer rotate-[6deg]"'
new_card3 = '<div\n                    onClick={() => onNavigateToAuth ? onNavigateToAuth("login_recruiter") : null}\n                    className="absolute bottom-6 right-0 sm:right-2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-20 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer rotate-[6deg]"'

if old_card3 in text_landing:
    text_landing = text_landing.replace(old_card3, new_card3)

with open(path_landing, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text_landing)

print("Landing.jsx updated successfully!")
