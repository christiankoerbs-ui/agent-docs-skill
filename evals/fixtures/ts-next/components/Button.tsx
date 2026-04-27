import * as React from "react";

type Props = {
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  onClick?: () => void;
};

export function Button({ variant = "primary", children, onClick }: Props) {
  const cls =
    variant === "primary"
      ? "bg-brand-500 text-white px-gutter py-2 rounded"
      : "text-brand-900 px-gutter py-2 rounded";
  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
