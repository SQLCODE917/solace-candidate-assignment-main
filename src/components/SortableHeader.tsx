"use client";
import { ReactNode } from "react";

export type Props = {
  onSort: () => void;
  sortDirection: "asc" | "desc" | undefined;
  sort: boolean;
  children: ReactNode;
};
export default function SortableHeader(props: Props) {
  const { onSort, sortDirection, sort, children } = props;

  return (
    <th onClick={onSort} style={{ cursor: "pointer" }}>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
      >
        {children}
        <span
          style={{ display: "inline-block", width: "1ch", textAlign: "center" }}
        >
          {sort ? (sortDirection === "asc" ? "▲" : "▼") : ""}
        </span>
      </span>
    </th>
  );
}
