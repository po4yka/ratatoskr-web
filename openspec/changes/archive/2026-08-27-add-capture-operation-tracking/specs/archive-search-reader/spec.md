## MODIFIED Requirements

### Requirement: Reader settings and progress remain local and recoverable
The reader SHALL persist its font scale, line height, measure, theme, font
family, and local read/favorite presentation settings, restore valid values at
the next render, display read and favorite action state, and show reading
progress. It SHALL save progress for a document as a ratio of scrollable
distance, and a resume action SHALL restore the matching scroll offset when
the document is revisited.

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

#### Scenario: capture list controls change local state only
- **WHEN** a user marks a listed capture result read or favorite
- **THEN** its list presentation updates without claiming that Platform changed
  archive metadata
