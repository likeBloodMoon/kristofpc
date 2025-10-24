// app/components/Reveal.tsx
"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type RevealBaseProps = Omit<
  HTMLMotionProps<"div">,
  // we control these defaults; callers can still override via ...rest if needed
  "initial" | "whileInView" | "viewport" | "transition"
> & {
  /** starting x offset in px */
  x?: number;
  /** starting y offset in px */
  y?: number;
};

const Reveal = React.forwardRef<HTMLDivElement, RevealBaseProps>(
  ({ children, className, x = 0, y = 16, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, x, y }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);

Reveal.displayName = "Reveal";
export default Reveal;
