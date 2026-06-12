"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type QuillType from "quill";

export interface RichStoryEditorHandle {
  getHTML: () => string;
  setHTML: (html: string) => void;
}

interface RichStoryEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const RichStoryEditor = forwardRef<RichStoryEditorHandle, RichStoryEditorProps>(
  function RichStoryEditor({ value, onChange }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<QuillType | null>(null);
    const latestValueRef = useRef(value);
    const lastAppliedValueRef = useRef("");
    const lastEmittedValueRef = useRef("");
    const [mode, setMode] = useState<"visual" | "html">("visual");

    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    });

    const cleanIncomingHtml = useCallback((html: string) => {
      return (html || "")
        .replace(/^(\s|&nbsp;|<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>|<div>(\s|&nbsp;|<br\s*\/?>)*<\/div>|<br\s*\/?>)+/gi, "")
        .trim();
    }, []);

    const applyHTML = useCallback((html: string, quillInstance?: QuillType) => {
      const nextHtml = cleanIncomingHtml(html);
      const quill = quillInstance || quillRef.current;
      if (quill) {
        quill.clipboard.dangerouslyPasteHTML(nextHtml);
        lastAppliedValueRef.current = html || "";
        return;
      }

      const editor = editorRef.current?.querySelector(".ql-editor");
      if (editor) {
        editor.innerHTML = nextHtml;
        lastAppliedValueRef.current = html || "";
      }
    }, [cleanIncomingHtml]);

    useImperativeHandle(ref, () => ({
      getHTML: () => (mode === "html" ? latestValueRef.current : editorRef.current?.querySelector(".ql-editor")?.innerHTML || ""),
      setHTML: (html: string) => {
        applyHTML(html);
      },
    }), [applyHTML, mode]);

    useEffect(() => {
      latestValueRef.current = value;

      if ((value || "") === lastEmittedValueRef.current) {
        return;
      }

      if ((value || "") !== lastAppliedValueRef.current) {
        applyHTML(value);
      }
    }, [applyHTML, value]);

    useEffect(() => {
      let mounted = true;

      async function initialize() {
        if (!editorRef.current || quillRef.current) return;
        const Quill = (await import("quill")).default;
        if (!mounted || !editorRef.current) return;

        // Clean up any existing Quill elements/toolbars first to prevent duplicates
        if (wrapperRef.current) {
          const toolbars = wrapperRef.current.querySelectorAll(".ql-toolbar");
          toolbars.forEach((tb) => tb.remove());
        }
        editorRef.current.innerHTML = "";

        const quill = new Quill(editorRef.current, {
          theme: "snow",
          placeholder: "Write your story with rich text, media, embeds, headings, lists, quotes, and links...",
          modules: {
            toolbar: {
              container: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ align: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["blockquote", "code-block"],
                ["link", "image", "video"],
                ["clean"],
              ],
              handlers: {
                image: () => handleImageUpload(quill),
                video: () => handleVideoEmbed(quill),
              },
            },
          },
        });

        quillRef.current = quill;
        applyHTML(latestValueRef.current || "", quill);
        quill.on("text-change", () => {
          const html = quill.root.innerHTML;
          lastEmittedValueRef.current = html;
          onChangeRef.current(html);
        });
      }

      initialize();

      const wrapperEl = wrapperRef.current;
      return () => {
        mounted = false;
        quillRef.current = null;
        if (wrapperEl) {
          const toolbars = wrapperEl.querySelectorAll(".ql-toolbar");
          toolbars.forEach((tb) => tb.remove());
        }
      };
    }, [cleanIncomingHtml, applyHTML]);

    return (
      <div ref={wrapperRef} className="quill-story-editor rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-slate-50/80 px-3 py-2 dark:border-zinc-850 dark:bg-zinc-900/70">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-300">Story Body Editor</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => {
                setMode("visual");
                applyHTML(latestValueRef.current);
              }}
              className={`h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${mode === "visual" ? "bg-[var(--grad-primary)] text-white shadow-sm" : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setMode("html")}
              className={`h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${mode === "html" ? "bg-[var(--grad-primary)] text-white shadow-sm" : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}
            >
              HTML
            </button>
          </div>
        </div>
        <div className={mode === "visual" ? "block" : "hidden"}>
          <div ref={editorRef} />
        </div>
        {mode === "html" && (
          <textarea
            value={value || ""}
            onChange={(event) => {
              latestValueRef.current = event.target.value;
              lastEmittedValueRef.current = event.target.value;
              onChange(event.target.value);
            }}
            spellCheck={false}
            className="min-h-[520px] w-full resize-y bg-white px-5 py-4 font-mono text-xs leading-6 text-slate-900 outline-none dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="<p>Write or paste HTML story content here...</p>"
          />
        )}
      </div>
    );
  }
);

async function handleImageUpload(quill: QuillType) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const range = quill.getSelection(true);
    quill.insertText(range.index, "Uploading image...", "italic", true);

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      quill.deleteText(range.index, "Uploading image...".length);

      if (!response.ok || result.error || !result.media?.url) {
        window.alert(result.error || "Image upload failed.");
        return;
      }

      quill.insertEmbed(range.index, "image", result.media.url, "user");
      quill.setSelection(range.index + 1);
    } catch (error: any) {
      quill.deleteText(range.index, "Uploading image...".length);
      window.alert(error.message || "Image upload failed.");
    }
  };
}

function handleVideoEmbed(quill: QuillType) {
  const url = window.prompt("Paste a YouTube, Vimeo, or video embed URL");
  if (!url) return;
  const range = quill.getSelection(true);
  quill.insertEmbed(range.index, "video", normalizeVideoUrl(url), "user");
  quill.setSelection(range.index + 1);
}

function normalizeVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }
    return url;
  } catch {
    return url;
  }
}

