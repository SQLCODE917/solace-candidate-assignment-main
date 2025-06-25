"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useReducer,
} from "react";
import { Advocate } from "@/db/types";
import DebouncedInput from "@/components/DebouncedInput";
import { AdvocatesResponse } from "@/app/api/advocates/route";

type LoadingState = { status: "loading" };
type ErrorState = { status: "error"; error: string };
type ReadyState = {
  advocates: Advocate[];
  pagination: AdvocatesResponse["pagination"];
  status: "ready";
  sortColumn: keyof Advocate | undefined;
  sortDirection: "asc" | "desc" | undefined;
};
type State = LoadingState | ErrorState | ReadyState;

const isReadyState = (state: State): state is ReadyState => {
  return state.status === "ready";
};

const isLoadingState = (state: State): state is LoadingState => {
  return state.status === "loading";
};

export function useAdvocates() {
  const [state, setState] = useState<State>({
    status: "loading",
  });

  const getAdvocates = useCallback(
    (
      props: {
        sortColumn?: ReadyState["sortColumn"];
        sortDirection?: ReadyState["sortDirection"];
        cursor?: string;
        direction?: string;
      } = {},
    ) => {
      const url = new URL("/api/advocates", window.location.origin);
      const { sortColumn, sortDirection, cursor, direction } = props;

      if (cursor) url.searchParams.set("cursor", cursor);
      if (direction) url.searchParams.set("direction", direction);
      if (sortColumn) url.searchParams.set("column", sortColumn);
      if (sortDirection) url.searchParams.set("sort", sortDirection);

      setState({ status: "loading" });

      fetch(url.toString())
        .then((response) => response.json())
        .then((jsonResponse) => {
          setState({
            status: "ready",
            advocates: jsonResponse.data,
            pagination: jsonResponse.pagination,
            sortColumn,
            sortDirection,
          });
        })
        .catch((error) => {
          console.error("Get Advocates Error:", error);
          setState({
            status: "error",
            error: error.message,
          });
        });
    },
    [],
  );

  useEffect(() => {
    console.log("fetching advocates on page load...");
    getAdvocates();
  }, [getAdvocates]);

  const sort = (sortColumn: ReadyState["sortColumn"]) => {
    console.log("sorting by " + sortColumn);
    if (isReadyState(state)) {
      const newDirection: ReadyState["sortDirection"] =
        state.sortDirection === "asc" ? "desc" : "asc";

      getAdvocates({ sortColumn, sortDirection: newDirection });
    }
  };

  const onNextPage = useCallback(() => {
    if (isReadyState(state)) {
      getAdvocates({
        sortColumn: state.sortColumn,
        sortDirection: state.sortDirection,
        cursor: state.pagination.nextCursor,
        direction: "next",
      });
    }
  }, [getAdvocates, state]);

  const onPrevPage = useCallback(() => {
    if (isReadyState(state)) {
      getAdvocates({
        sortColumn: state.sortColumn,
        sortDirection: state.sortDirection,
        cursor: state.pagination.prevCursor,
        direction: "prev",
      });
    }
  }, [getAdvocates, state]);

  const hasNextPage = useMemo(() => {
    return isReadyState(state) && state.pagination.hasNextPage;
  }, [state]);

  const hasPrevPage = useMemo(() => {
    return isReadyState(state) && state.pagination.hasPrevPage;
  }, [state]);

  return {
    state,
    onPrevPage,
    onNextPage,
    hasNextPage,
    hasPrevPage,
    sort,
  };
}

export function useSearch(state: State) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAdvocates = useMemo(() => {
    if (!isReadyState(state)) return [];

    const normalizedTerm = searchTerm.trim().toLowerCase();
    return state.advocates.filter((advocate) => {
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
  }, [searchTerm, state]);

  const searchFor = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const resetSearch = () => {
    setSearchTerm("");
  };

  return {
    filteredAdvocates,
    searchTerm,
    searchFor,
    resetSearch,
  };
}

export default function Home() {
  const { state, onPrevPage, onNextPage, hasNextPage, hasPrevPage, sort } =
    useAdvocates();

  const { filteredAdvocates, searchTerm, searchFor, resetSearch } =
    useSearch(state);

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
          onDebouncedChange={searchFor}
        />
        <button className="reset-search" onClick={resetSearch}>
          Reset Search
        </button>
      </div>
      <br />
      <div className="pagination-controls">
        <button
          onClick={() => {
            onPrevPage();
          }}
          disabled={!hasPrevPage}
        >
          Previous
        </button>
        <button
          onClick={() => {
            onNextPage();
          }}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </div>
      <br />
      <table className="advocates-table">
        <thead>
          <tr>
            <th
              onClick={() => {
                /* Given more time, would refactor into a SortableTH component
                 * that would have a hover state and sort triangles or something for UX
                 */
                sort("firstName");
              }}
            >
              First Name
              {isReadyState(state) &&
                state.sortColumn === "firstName" &&
                ` (${state.sortDirection})`}
            </th>
            <th>Last Name</th>
            <th>City</th>
            <th>Degree</th>
            <th>Specialties</th>
            <th>Years of Experience</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {isLoadingState(state) && (
            <tr>
              <td className="table-placeholder" colSpan={7}>
                Loading...
              </td>
            </tr>
          )}
          {isReadyState(state) &&
            filteredAdvocates.map((advocate) => {
              return (
                <tr key={advocate.id}>
                  <td>{advocate.firstName}</td>
                  <td>{advocate.lastName}</td>
                  <td>{advocate.city}</td>
                  <td>{advocate.degree}</td>
                  <td>
                    {advocate.specialties.map((specialty) => (
                      <div key={specialty}>{specialty}</div>
                    ))}
                  </td>
                  <td>{advocate.yearsOfExperience}</td>
                  <td>{advocate.phoneNumber}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </main>
  );
}
