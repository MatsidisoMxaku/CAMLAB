import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface KaTeXProps {
  math: string;
  display?: boolean;
  className?: string;
}

function KaTeXRenderer({ math, display = false, className = "" }: KaTeXProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(math, ref.current, {
          displayMode: display,
          throwOnError: false,
          errorColor: "#ffb4ab",
          strict: false,
        });
      } catch {
        if (ref.current) ref.current.textContent = math;
      }
    }
  }, [math, display]);

  return (
    <span
      ref={ref}
      className={`katex-dark ${className}`}
      style={display ? { display: "block", overflowX: "auto" } : undefined}
    />
  );
}

export default KaTeXRenderer;