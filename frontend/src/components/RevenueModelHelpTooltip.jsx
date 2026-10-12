import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, DollarSign, Sparkles } from 'lucide-react';

export default function RevenueModelHelpTooltip({ align = 'right', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(prev => !prev)}
        }
        className="w-4 h-4 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 focus:text-indigo-600 focus:outline-none transition-all flex items-center justify-center cursor-pointer border border-slate-200/80 shadow-2xs hover:scale-105"
        title="What is a Revenue Model? Click to view explanation"
        aria-label="Explain Revenue Model"
        aria-expanded={isOpen}
      >
        <HelpCircle className="w-2.5 h-2.5" />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute top-6 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 text-xs animate-in fade-in zoom-in-95 duration-150 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="font-bold text-white text-xs leading-none">What is a Revenue Model?</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">How your company generates revenue</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explanation */}
          <p className="text-slate-300 text-[11px] leading-relaxed mt-2.5 mb-3">
            A <strong className="text-white">revenue model</strong> defines how a business charges customers and makes money from its offerings. Recruiters review this to understand if your growth background aligns with their economics (such as ARR, churn, ROAS, or LTV).
          </p>

          {/* Model Breakdown */}
          <div className="space-y-2 text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-indigo-300 font-semibold">Subscription:</span>{' '}
                <span className="text-slate-300">Recurring periodic fees (e.g. SaaS, software, memberships like Slack or Netflix). Focus: ARR, retention, churn.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-emerald-300 font-semibold">One-time sale:</span>{' '}
                <span className="text-slate-300">Single upfront purchase per product, license, or course (e.g. D2C e-commerce, consumer goods, retail).</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-amber-300 font-semibold">Retainer:</span>{' '}
                <span className="text-slate-300">Fixed ongoing contracted fee for services or consulting (e.g. marketing agencies, advisory firms).</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-cyan-300 font-semibold">Transaction fees:</span>{' '}
                <span className="text-slate-300">Percentage cut or usage fee per transaction processed (e.g. Stripe, Uber, Airbnb, marketplaces).</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Select the model that best reflects your past experience.</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
