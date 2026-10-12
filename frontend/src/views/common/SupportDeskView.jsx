import React, { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function SupportDeskView() {
  const { user } = useAuth();
  const [copied, setCopied] = useState("");

  const copyToClipboard = async (value) => {
    await navigator.clipboard?.writeText(value);
    setCopied(value);

    setTimeout(() => {
      setCopied("");
    }, 2000);
  };

  const channels = [
    {
      label: "Email support",
      value: "support@IntentPeople.in",
      description: "Account, verification and general platform support.",
      icon: Mail,
      action: "Send email",
      href: "mailto:support@IntentPeople.in",
      copy: true,
    },
    {
      label: "Priority support",
      value: "escalations@IntentPeople.in",
      description: "Urgent hiring, compliance or unresolved requests.",
      icon: ShieldCheck,
      action: "Escalate issue",
      href: "mailto:escalations@IntentPeople.in",
      copy: true,
    },
    {
      label: "WhatsApp",
      value: "+91 98765 43210",
      description: "Quick assistance during our business hours.",
      icon: MessageCircle,
      action: "Start chat",
      href: "https://wa.me/919876543210",
      external: true,
    },
    {
      label: "Phone support",
      value: "+91 98765 43210",
      description: "Speak directly with our support team.",
      icon: Phone,
      action: "Call now",
      href: "tel:+919876543210",
    },
  ];

  return (
    <div
      className="min-h-full bg-[#F8FAFC]"
      style={{
        fontFamily:
          "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                  <Headphones className="h-4 w-4 text-[#FF7043]" />
                </div>

                <span className="text-sm font-medium text-slate-500">
                  Support Center
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[30px]">
                How can we help?
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Get help with your IntentPeople account, verification,
                recruitment activity, or platform questions.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-medium text-slate-700">
                Support online
              </span>
            </div>

          </div>
        </header>

        {/* SLA */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

            <div className="px-5 py-4">
              <p className="text-xs font-medium text-slate-400">
                Response time
              </p>

              <div className="mt-1 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-400" />

                <p className="text-sm font-semibold text-slate-900">
                  Within 2 hours
                </p>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-medium text-slate-400">
                Availability
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                Mon – Sat · 9 AM – 8 PM
              </p>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-medium text-slate-400">
                Current status
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <p className="text-sm font-semibold text-slate-900">
                  All systems operational
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Main Support Panel */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Panel Header */}
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

            <h2 className="text-base font-semibold text-slate-950">
              Contact support
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the best way to reach our team.
            </p>

          </div>

          {/* Contact Rows */}
          <div>
            {channels.map((channel, index) => {
              const Icon = channel.icon;

              return (
                <div
                  key={channel.label}
                  className={`group px-5 py-5 transition-colors hover:bg-slate-50/70 sm:px-6 ${
                    index !== channels.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left */}
                    <div className="flex items-start gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          {channel.label}
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-slate-900 sm:text-[15px]">
                          {channel.value}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {channel.description}
                        </p>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2 pl-14 sm:pl-0">

                      {channel.copy && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(channel.value)
                          }
                          aria-label={`Copy ${channel.value}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          {copied === channel.value ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      <a
                        href={channel.href}
                        target={
                          channel.external ? "_blank" : undefined
                        }
                        rel={
                          channel.external
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 no-underline transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                      >
                        {channel.action}

                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </section>

        {/* Bottom CTA */}
        <section className="mt-5 rounded-2xl bg-slate-950 px-5 py-5 sm:px-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />

                <h3 className="text-sm font-semibold text-white">
                  Need urgent assistance?
                </h3>
              </div>

              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                Priority issues are routed directly to our escalation team.
              </p>
            </div>

            <a
              href="mailto:escalations@IntentPeople.in?subject=Priority%20Support%20Request"
              className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-white px-4 text-xs font-semibold text-slate-900 no-underline transition hover:bg-slate-100"
            >
              Contact priority support

              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

          </div>

        </section>

        {/* Footer */}
        <footer className="mt-6 flex flex-col gap-2 px-1 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">

          <span>
            Signed in as{" "}
            <strong className="font-medium text-slate-600">
              {user?.email || "Authenticated User"}
            </strong>
          </span>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure IntentPeople Support
          </div>

        </footer>

      </main>
    </div>
  );
}