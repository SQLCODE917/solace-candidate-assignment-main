"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Advocate } from "@/db/types";
import DebouncedInput from "@/components/DebouncedInput";
import { AdvocatesResponse } from "@/app/api/advocates/route";

/* ISSUE: this is TS, but where are the types???
 */
export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  /* adding pagination to support large datasets */
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<
    AdvocatesResponse["pagination"] | null
  >(null);
  /* ISSUE: no loading state hurts the user experience */
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("fetching advocates...");
    setLoading(true);
    fetch(`/api/advocates?page=${page}`)
      .then((response) => response.json())
      .then((jsonResponse: AdvocatesResponse) => {
        setAdvocates(jsonResponse.data);
        // pagination
        setPagination(jsonResponse.pagination);
      })
      .catch((error) => {
        console.log("ERRAR", error);
      })
      .finally(() => setLoading(false));
  }, [page]);

  /* ISSUE: yearsOfExperience is a number, does not have 'includes' property
   * ISSUE: requires exact string match, needs more flexibility
   * ISSUE: extra rerenders from updating filtered advocates, memoizing
   */
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

  /* ISSUE: 'e' has 'any' type, needs type correction
   */
  const onSearchTermChange = (searchTerm: string) => {
    //ISSUE: Not idiomatic, using state and {searchTerm} instead
    //document.getElementById("search-term").innerHTML = searchTerm;
    setSearchTerm(searchTerm);
  };

  const onClick = () => {
    console.log(advocates);

    /*ISSUE: it would be simpler to just reset the search term*/
    //setFilteredAdvocates(advocates);
    setSearchTerm("");
  };

  /*
   * ISSUE: no key when mapping over filteredAdvocates and over specialties
   * ISSUE: <input is uncontrolled and filters on every keystroke, needs a debouncing correction
   * ISSUE: not-normative HTML - <th>s need to be in a <tr>
   * */
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
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!pagination?.hasPrevPage}
        >
          Previous
        </button>
        <span style={{ margin: "0 12px" }}>
          Page {page} of {pagination?.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
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
            <div className="table-placeholder">Loading...</div>
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
