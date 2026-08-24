# api-type-generation Specification

## Purpose
Keeps the client's TypeScript view of the Platform API synchronized with a pinned copy of the Platform OpenAPI document, so that drift between the contract and the generated types fails the build instead of surfacing as wrong calls at runtime.

## Requirements

### Requirement: The Platform contract document is pinned by content

The repository SHALL contain a pinned copy of the Platform OpenAPI document together with a lock file that records the SHA-256 digest of those bytes, the Platform revision the copy came from, and the identity of the tool that produced the committed output. The lock file SHALL NOT contain timestamp fields, so identical inputs produce identical lock contents.

#### Scenario: Lock file matches the pinned document

- **WHEN** the SHA-256 digest of the pinned OpenAPI document is computed and compared against the digest recorded in the lock file
- **THEN** the two digests are equal

#### Scenario: Lock file carries provenance and no timestamps

- **WHEN** the lock file is parsed as JSON
- **THEN** it records a source digest, a Platform source revision, and a generator name and version, and it contains no timestamp field

### Requirement: Generation from the pinned document is deterministic

Running the generation step repeatedly against an unchanged pinned document SHALL produce output byte-identical to the committed generated module, independent of time, locale, or filesystem ordering.

#### Scenario: Repeated generation reproduces the committed module byte for byte

- **WHEN** the generation step runs twice against the unchanged pinned document
- **THEN** both outputs are byte-identical to each other and to the committed generated module

### Requirement: Drift between the pinned document and generated output fails the build

The repository SHALL provide a verification step that regenerates output from the pinned document without touching the working tree and compares the result against the committed generated module. It SHALL exit zero when they match, exit non-zero with a message identifying the disagreement when they differ, and leave tracked files unmodified in both cases. The CI gate SHALL run this verification step before the test suite.

#### Scenario: Verification passes on a consistent tree

- **WHEN** the verification step runs on a working tree whose committed generated module matches the pinned document
- **THEN** it exits zero and no tracked file changes

#### Scenario: Modified pinned document without regeneration fails verification

- **WHEN** the pinned OpenAPI document is modified while the generated module remains as committed
- **THEN** the verification step exits non-zero, names the disagreeing artifacts, and leaves the working tree unmodified

#### Scenario: The gate runs verification before tests

- **WHEN** the gate command list in the workflow file and the gate command block in the development guide are compared
- **THEN** both contain the verification step at the same relative position

### Requirement: The generated module is consumed as-is

The committed generated module SHALL begin with a notice stating that it is generated and must not be edited by hand. Client code SHALL consume API shapes by importing types from the generated module rather than declaring them again by hand.

#### Scenario: Generated module announces itself as generated

- **WHEN** the first lines of the committed generated module are read
- **THEN** they contain a do-not-edit notice naming the generator

#### Scenario: Consumers resolve types from the generated module

- **WHEN** a test imports a named type exported by the generated module and the test suite runs
- **THEN** the import resolves and the test passes
