"use client";

import { ChangeEvent, useEffect, useMemo, useState, useCallback } from "react";
import { Advocate } from "@/db/types";
import DebouncedInput from "@/components/DebouncedInput";
import { AdvocatesResponse } from "@/app/api/advocates/route";

function getAdvocates(
  cursor?: string,
  direction?: string,
): Promise<AdvocatesResponse> {
  const url = new URL("/api/advocates", window.location.origin);
  if (cursor) url.searchParams.set("cursor", cursor);
  if (direction) url.searchParams.set("direction", direction);

  return fetch(url.toString()).then((response) =>
    response.json(),
  ) as Promise<AdvocatesResponse>;
}

export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<
    AdvocatesResponse["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("fetching advocates on page load...");
    setLoading(true);
    getAdvocates()
      .then((jsonResponse) => {
        setAdvocates(jsonResponse.data);
        setPagination(jsonResponse.pagination);
      })
      .catch((error) => {
        console.log("ERRAR", error);
      })
      .finally(() => setLoading(false));
  }, []);

  const onNavigation = useCallback(
    (direction: "next" | "prev", cursor?: string) => {
      setLoading(true);
      getAdvocates(cursor, direction)
        .then((jsonResponse) => {
          setAdvocates(jsonResponse.data);
          setPagination(jsonResponse.pagination);
        })
        .catch((error) => {
          console.log("ERRAR", error);
        })
        .finally(() => setLoading(false));
    },
    [],
  );

  const filteredAdvocates = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return advocates.filter((advocate) => {
      const fields = [
        advocate.firstName,
        advocate.lastName,
        advocate.city,
        advocate.degree,
        ...advocate.specialties,
        String(advocate.yearsOfExperience),
      ];
      return fields.some((field) =>
        field.toLowerCase().includes(normalizedTerm),
      );
    });
  }, [searchTerm, advocates]);

  const onSearchTermChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const onClick = () => {
    console.log(advocates);
    setSearchTerm("");
  };

  return (
    <main className="font-sans" style={{ margin: "24px" }}>
      <h1 className="padding-global bg-deepForestGreen text-white">
        Solace Advocates
      </h1>
      <div className="nav-like">
        <p className="brand">Search</p>
        <DebouncedInput
          style={{ border: "1px solid black" }}
          value={searchTerm}
          onDebouncedChange={onSearchTermChange}
        />
        <button className="reset-search" onClick={onClick}>
          Reset Search
        </button>
      </div>
      <br />
      <div className="pagination-controls">
        <button
          onClick={() => {
            onNavigation("prev", pagination.prevCursor);
          }}
          disabled={!pagination?.hasPrevPage}
        >
          Previous
        </button>
        <button
          onClick={() => {
            onNavigation("next", pagination.nextCursor);
          }}
          disabled={!pagination?.hasNextPage}
        >
          Next
        </button>
      </div>
      <br />
      <table className="advocates-table">
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>City</th>
            <th>Degree</th>
            <th>Specialties</th>
            <th>Years of Experience</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="table-placeholder" colSpan={7}>
                Loading...
              </td>
            </tr>
          ) : (
            filteredAdvocates.map((advocate, i) => {
              return (
                <tr key={i}>
                  <td>{advocate.firstName}</td>
                  <td>{advocate.lastName}</td>
                  <td>{advocate.city}</td>
                  <td>{advocate.degree}</td>
                  <td>
                    {advocate.specialties.map((specialty, i) => (
                      <div key={i}>{specialty}</div>
                    ))}
                  </td>
                  <td>{advocate.yearsOfExperience}</td>
                  <td>{advocate.phoneNumber}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </main>
  );
}
