import { Sparkles } from "lucide-react";

import { Reveal } from "@/components/home/Reveal";
import { AI_SECTION, AI_TAGS } from "@/lib/home-content";
import { getItemTypeStyle } from "@/lib/item-types";

// Token colours for the sample snippet, close to the app's editor theme.
function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-purple-400">{children}</span>;
}

function Fn({ children }: { children: React.ReactNode }) {
  return <span className="text-blue-400">{children}</span>;
}

function Vr({ children }: { children: React.ReactNode }) {
  return <span className="text-amber-400">{children}</span>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <span className="text-emerald-400">{children}</span>;
}

const CODE_LINES: React.ReactNode[] = [
  <>
    <Kw>export function</Kw> <Fn>useDebounce</Fn>
    {"<T>("}
    <Vr>value</Vr>: T, <Vr>delay</Vr> = <Num>300</Num>
    {") {"}
  </>,
  <>
    {"  "}
    <Kw>const</Kw> [<Vr>debounced</Vr>, <Fn>setDebounced</Fn>] ={" "}
    <Fn>useState</Fn>(<Vr>value</Vr>);
  </>,
  <>{" "}</>,
  <>
    {"  "}
    <Fn>useEffect</Fn>
    {"(() => {"}
  </>,
  <>
    {"    "}
    <Kw>const</Kw> <Vr>id</Vr> = <Fn>setTimeout</Fn>
    {"(() => "}
    <Fn>setDebounced</Fn>(<Vr>value</Vr>), <Vr>delay</Vr>);
  </>,
  <>
    {"    "}
    <Kw>return</Kw> {"() => "}
    <Fn>clearTimeout</Fn>(<Vr>id</Vr>);
  </>,
  <>
    {"  }, ["}
    <Vr>value</Vr>, <Vr>delay</Vr>
    {"]);"}
  </>,
  <>{" "}</>,
  <>
    {"  "}
    <Kw>return</Kw> <Vr>debounced</Vr>;
  </>,
  <>{"}"}</>,
];

// Staggers the tags in behind one another.
const TAG_DELAYS = [
  "delay-150",
  "delay-[280ms]",
  "delay-[410ms]",
  "delay-[540ms]",
  "delay-[670ms]",
];

/** The editor window beside the AI copy: a sample snippet and its suggested tags. */
export function CodeMockup() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border bg-card shadow-2xl"
    >
      <div className="flex items-center gap-3 border-b bg-white/3 px-3.5 py-2.5 text-xs text-muted-foreground/70">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-red-400" />
          <i className="size-2.5 rounded-full bg-amber-400" />
          <i className="size-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="font-mono text-muted-foreground">
          {AI_SECTION.fileName}
        </span>
        <span className="ml-auto rounded-full border px-2 py-0.5 text-[10.5px] text-type-snippet">
          {AI_SECTION.language}
        </span>
      </div>

      <pre className="overflow-x-auto py-4.5 pr-4.5 pl-2 font-mono text-[12.5px] leading-[1.75] text-slate-300">
        <code>
          {CODE_LINES.map((line, index) => (
            <span key={index} className="block">
              <span className="mr-3.5 inline-block w-6.5 text-right text-white/20 select-none">
                {index + 1}
              </span>
              {line}
            </span>
          ))}
        </code>
      </pre>

      <div className="border-t bg-black/20 px-4.5 pt-3.5 pb-4.5">
        <p className="mb-3 flex items-center gap-2 text-[11.5px] font-bold tracking-[0.06em] text-type-prompt uppercase">
          <Sparkles className="spark-pulse size-3.5" />
          {AI_SECTION.tagsLabel}
        </p>

        {/* Chips rather than a list: Reveal renders a div, which can't sit
            inside a <ul>, and the whole mockup is decorative anyway. */}
        <div className="flex flex-wrap gap-2">
          {AI_TAGS.map((tag, index) => {
            const { textClass, bgClass } = getItemTypeStyle(tag.type);

            return (
              <Reveal key={tag.label} className={TAG_DELAYS[index]}>
                <span
                  className={`block rounded-full border border-transparent px-2.5 py-1 font-mono text-[11.5px] ${bgClass} ${textClass}`}
                >
                  {tag.label}
                </span>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
