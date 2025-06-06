# Notes

## Improvements

For every change I've made, I have left a comment in the code, like "ISSUE: ...".
For your convenience, I will summarize them here as well:

- Added types to state, network request response, etc as to take advantage of this codebase's TS support
- Upgraded drizzle-orm to latest version, so that I could use the official documentation
- ^ that was necessary to quickly understand how to update the DB query to support pagination (to meet the AC of supporting large datasets
- Added a loading state, so that the UI is responsive to network requests
- `yearsOfExperience` is a number, does not have `includes` property - fixed.
- filtering was based on exact string matching, I made it more flexible.
- memoized the filtering function to avoid rerenders
- added debouncing to the search input as to not filter on every keystroke
- simplified resetting search by clearing the search term
- added keys to mapped items in the JSX
- made the `input` a controlled component to have predictable renders
- table markup was not-normative, <th>'s need to be in a <tr> - fixed.
- typed the "specialties" array in the schema, so that InferModel would return a "string[]" type, instead of an "unknown"
- removed the Null Object Pattern from db setup, so that the DB client type would always be the PostgresJsDatabase<typeof schema>, without a union with the Null Object type.
Since the lack of a Database URL is an unrecoverable error, Instead of the Null Object Pattern, the setup function throws an error early and exits.
- styled the table with sticky headers, responsive columns that don't jump on loading, and brand colors and styles
- styled the new table pagination controls with Previous and Next buttons that have enabled and disabled states

## Improvements not implemented
- My styling is not-normative: having never used tailwind before,
I could have used a consultation with the team to understand the how the team preferes to separate concerns 
(when the team prefers to use utility classes, vs css, how they handle common colors and styles, etc - 
all the questions that are usually answered by a design system and existing code examples).
- I like the Null Object Pattern that was started in the `setup` function -  I could have applied it to encapsilate meaningful UX states on the Page - not just Error, but also Loading, Ready and whatever else, using TS type narrowing to create the correct ViewModel and View.
For components with many meaningful states, I prefer that, so that there's no deep conditional logic in the JSX and the component is declarative and clear to read, but given the time constraint and the simple UX states, I didn't go this far.

Looking forward to hearing your feedback on these design decisions.
