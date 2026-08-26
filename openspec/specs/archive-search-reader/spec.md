# archive-search-reader Specification

## Purpose

Lets an authenticated archive reader search fixture-projected documents and
read their content without hiding the provenance, warnings, or analysis limits.

## Requirements

### Requirement: Search state is addressable and complete

The client SHALL render a search query control, only modes the fixture payload
declares available, and paginated result rows. Query text, selected mode, and
page SHALL be represented in the search URL so that a reload or shared URL
reconstructs the same search state; an invalid mode or page SHALL resolve to a
safe available mode and first page.

#### Scenario: a search URL restores all state

- **WHEN** a user opens a search URL containing a query, an available mode, and
  a positive page
- **THEN** the query control, mode control, and displayed result page match the
  URL values

#### Scenario: a new search changes the address and resets pagination

- **WHEN** a user changes the query or mode from a later result page
- **THEN** the search URL records the new value and first page

### Requirement: Search evidence remains visible and escaped

The client SHALL render each fixture result's match explanation and snippet,
and SHALL highlight only case-insensitive literal occurrences of the active
query in the snippet. A query that is absent, empty, or contains regular
expression syntax SHALL not alter other text or create markup from fixture
content.

#### Scenario: multiple literal matches are highlighted

- **WHEN** a result snippet contains two case-insensitive occurrences of the
  active literal query
- **THEN** the row exposes two highlighted text segments and preserves the
  surrounding snippet text

#### Scenario: regular-expression characters are literal

- **WHEN** the active query contains regular-expression syntax
- **THEN** only exact literal occurrences are highlighted and fixture text is
  rendered as text rather than injected markup

### Requirement: Reader renders qualified source evidence

The document reader SHALL render fixture-projected Document IR content with a
provenance header naming its source address and extraction path, every provided
extraction warning, available TLDR and key points, and its supplied tags.
Missing analysis SHALL render as unavailable rather than invented summary
content.

#### Scenario: a degraded extracted document remains qualified

- **WHEN** a document fixture supplies provenance, two warnings, a TLDR, and
  key points
- **THEN** the reader displays the provenance values, both warnings, the TLDR,
  and the key points before or alongside the document content

#### Scenario: absent analysis is not synthesized

- **WHEN** a document fixture has no analysis payload
- **THEN** the reader reports that no analysis is available and displays no
  summary or key-point text

### Requirement: Reader settings and progress remain local and recoverable

The reader SHALL persist its font scale, line height, measure, theme, and font
family settings locally, restore valid values at the next render, display read
and favorite action state, and show reading progress. It SHALL save progress
for a document as a ratio of scrollable distance, and a resume action SHALL
restore the matching scroll offset when the document is revisited.

#### Scenario: reading settings survive remount

- **WHEN** a user changes one or more reading settings and later reopens the
  same reader in the browser
- **THEN** the corresponding settings control and rendered reader styles use
  the saved valid values

#### Scenario: progress resumes by scrollable-distance ratio

- **WHEN** a document has saved progress at one half of its scrollable distance
  and the current scrollable distance is 800 pixels
- **THEN** selecting resume scrolls the reader to 400 pixels

#### Scenario: invalid local values are ignored

- **WHEN** local storage contains an invalid reader setting or progress value
- **THEN** the reader uses a safe default and remains usable

### Requirement: Fixture integration is explicitly bounded

Until the generated Platform contract exposes the Knowledge search and document
read operations, the feature SHALL use only deterministic fixture projections
through an injectable local seam. It SHALL not issue undeclared Edge API
requests or create browser-owned wire types, and its integration status SHALL
remain pending in the change documentation.

#### Scenario: fixture mode performs no undeclared network request

- **WHEN** the search and reader integration tests render their fixture seam
- **THEN** they complete without a request to an undeclared search or document
  Edge API path
