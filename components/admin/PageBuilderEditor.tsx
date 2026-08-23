"use client";

import { useState, useTransition } from "react";
import {
  addSectionAction,
  moveSectionAction,
  duplicateSectionAction,
  deleteSectionAction,
  toggleSectionEnabledAction,
  updateSectionAction
} from "@/lib/admin/pageBuilderActions";
import type { PageSection, PageSectionType } from "../../types/database";

const SECTION_TYPES: { type: PageSectionType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "heading", label: "Heading" },
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "button", label: "Button" },
  { type: "product_grid", label: "Product Grid" },
  { type: "featured_products", label: "Featured Products" },
  { type: "categories", label: "Categories" },
  { type: "banner", label: "Banner" },
  { type: "cta", label: "CTA" },
  { type: "newsletter", label: "Newsletter" },
  { type: "faq", label: "FAQ" },
  { type: "custom_html", label: "Custom HTML" }
];

export default function SectionEditor({
  pageId,
  pageSlug,
  sections
}: {
  pageId: string;
  pageSlug: string;
  sections: PageSection[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    // Server actions revalidate the path; a soft reload picks up the change
    // without losing scroll position since Next re-renders in place.
    window.location.reload();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card p-4 lg:col-span-1">
        <h2 className="mb-3 font-semibold text-slate-900">Add Section</h2>
        <div className="grid grid-cols-2 gap-2">
          {SECTION_TYPES.map((st) => (
            <form
              key={st.type}
              action={(fd) =>
                startTransition(async () => {
                  await addSectionAction(fd);
                  refresh();
                })
              }
            >
              <input type="hidden" name="pageId" value={pageId} />
              <input type="hidden" name="type" value={st.type} />
              <button disabled={isPending} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-brand-300">
                + {st.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:col-span-2">
        {sections.map((section, i) => (
          <div key={section.id} className="card overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{i + 1}</span>
                <span className="font-medium capitalize text-slate-900">{section.type.replace(/_/g, " ")}</span>
                {!section.is_enabled && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Disabled</span>}
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  label="Move up"
                  disabled={i === 0 || isPending}
                  action={moveSectionAction}
                  hidden={{ id: section.id, direction: "up" }}
                  onDone={refresh}
                  startTransition={startTransition}
                >
                  ↑
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={i === sections.length - 1 || isPending}
                  action={moveSectionAction}
                  hidden={{ id: section.id, direction: "down" }}
                  onDone={refresh}
                  startTransition={startTransition}
                >
                  ↓
                </IconButton>
                <IconButton label="Duplicate" action={duplicateSectionAction} hidden={{ id: section.id }} onDone={refresh} startTransition={startTransition}>
                  ⧉
                </IconButton>
                <IconButton
                  label={section.is_enabled ? "Disable" : "Enable"}
                  action={toggleSectionEnabledAction}
                  hidden={{ id: section.id, isEnabled: String(section.is_enabled) }}
                  onDone={refresh}
                  startTransition={startTransition}
                >
                  {section.is_enabled ? "⏸" : "▶"}
                </IconButton>
                <IconButton label="Delete" action={deleteSectionAction} hidden={{ id: section.id }} onDone={refresh} startTransition={startTransition} danger>
                  ✕
                </IconButton>
                <button
                  onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-300"
                >
                  {expandedId === section.id ? "Close" : "Edit"}
                </button>
              </div>
            </div>
            {expandedId === section.id && <SectionEditForm section={section} onSaved={refresh} />}
          </div>
        ))}
        {sections.length === 0 && <p className="card p-8 text-center text-slate-400">No sections yet — add one from the left.</p>}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  action,
  hidden,
  disabled,
  danger,
  onDone,
  startTransition
}: {
  children: React.ReactNode;
  label: string;
  action: (fd: FormData) => Promise<void>;
  hidden: Record<string, string>;
  disabled?: boolean;
  danger?: boolean;
  onDone: () => void;
  startTransition: (fn: () => void) => void;
}) {
  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await action(fd);
          onDone();
        })
      }
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`rounded-full px-2 py-1 text-sm ${danger ? "text-red-500 hover:bg-red-50" : "text-slate-500 hover:bg-slate-100"} disabled:opacity-30`}
      >
        {children}
      </button>
    </form>
  );
}

function SectionEditForm({ section, onSaved }: { section: PageSection; onSaved: () => void }) {
  const [config, setConfig] = useState(JSON.stringify(section.config ?? {}, null, 2));
  const [html, setHtml] = useState(section.custom_html ?? "");
  const [css, setCss] = useState(section.custom_css ?? "");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isPending, startTransition] = useTransition();
  const [jsonError, setJsonError] = useState<string | null>(null);

  const widths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  function save() {
    try {
      if (section.type !== "custom_html") JSON.parse(config);
      setJsonError(null);
    } catch {
      setJsonError("Config must be valid JSON.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", section.id);
      if (section.type === "custom_html") {
        fd.set("customHtml", html);
        fd.set("customCss", css);
      } else {
        fd.set("config", config);
      }
      await updateSectionAction(fd);
      onSaved();
    });
  }

  if (section.type === "custom_html") {
    return (
      <div className="border-t border-slate-100 p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase text-slate-500">HTML</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={8}
              spellCheck={false}
              className="rounded-lg border border-slate-200 p-3 font-mono text-xs"
            />
            <label className="text-xs font-semibold uppercase text-slate-500">CSS (supports @media queries)</label>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              rows={8}
              spellCheck={false}
              className="rounded-lg border border-slate-200 p-3 font-mono text-xs"
            />
            <p className="text-xs text-slate-400">
              Sanitized on save — scripts, event handlers, iframes, and forms are stripped for security.
            </p>
            <button onClick={save} disabled={isPending} className="btn-primary self-start !py-2 text-sm">
              {isPending ? "Saving..." : "Save Draft"}
            </button>
          </div>
          <div>
            <div className="mb-2 flex gap-2">
              {(["desktop", "tablet", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${device === d ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600"}`}
                >
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div style={{ width: widths[device], maxWidth: "100%", margin: "0 auto" }} className="bg-white">
                <style dangerouslySetInnerHTML={{ __html: css }} />
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 p-4">
      <label className="text-xs font-semibold uppercase text-slate-500">Config (JSON)</label>
      <textarea
        value={config}
        onChange={(e) => setConfig(e.target.value)}
        rows={8}
        spellCheck={false}
        className="mt-2 w-full rounded-lg border border-slate-200 p-3 font-mono text-xs"
      />
      {jsonError && <p className="mt-1 text-xs text-red-500">{jsonError}</p>}
      <button onClick={save} disabled={isPending} className="btn-primary mt-3 !py-2 text-sm">
        {isPending ? "Saving..." : "Save Draft"}
      </button>
    </div>
  );
}
