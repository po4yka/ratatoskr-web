## MODIFIED Requirements

### Requirement: Search state is addressable and complete

The client SHALL render a search query control, only modes the fixture payload
declares available, an optional fixture tag filter, and paginated result rows.
Query text, selected mode, selected tag, and page SHALL be represented in the
search URL so that a reload or shared URL reconstructs the same search state;
an invalid mode, tag, or page SHALL resolve to a safe available value and first
page.

#### Scenario: a search URL restores all state

- **WHEN** a user opens a search URL containing a query, an available mode, and
  a positive page
- **THEN** the query control, mode control, and displayed result page match the
  URL values

#### Scenario: a new search changes the address and resets pagination

- **WHEN** a user changes the query or mode from a later result page
- **THEN** the search URL records the new value and first page

#### Scenario: a tag filter is restored from the address

- **WHEN** a user opens a search URL containing an available fixture tag
- **THEN** the tag control and result rows match the tag URL value
