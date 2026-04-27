import * as React from "react";

export function Dashboard({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
      <p>Welcome.</p>
    </main>
  );
}
