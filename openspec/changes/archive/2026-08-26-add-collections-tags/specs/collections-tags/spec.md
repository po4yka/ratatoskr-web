## Purpose

Lets an archive reader curate deterministic fixture records as collections and
tags while making the missing server-owned integration unmistakable.

## ADDED Requirements

### Requirement: Collections are manageable from list and detail views

The client SHALL list fixture collections and let a user create, rename, and
open one. A collection detail view SHALL show its items in server-supplied
order and let a user add an available result or remove an existing item.

#### Scenario: a new collection opens in its detail view

- **WHEN** a user enters a valid new collection name and creates it
- **THEN** the list includes the collection and the browser opens its detail
  address

#### Scenario: item order stays visible after a collection mutation

- **WHEN** a user adds or removes an item in a fixture collection
- **THEN** the detail view renders the remaining items in the source order

### Requirement: Collection deletion is deliberate and reversible on failure

The client SHALL name a collection and its consequence before deletion. A
confirmed mutation SHALL update the visible list promptly, and a rejected
harness operation SHALL restore the prior list and display a recoverable
failure.

#### Scenario: a named collection requires confirmation before deletion

- **WHEN** a user selects delete for a collection
- **THEN** no deletion occurs until the confirmation names that collection and
  the user confirms it

#### Scenario: a rejected deletion restores the collection

- **WHEN** the fixture harness rejects a confirmed collection deletion
- **THEN** the collection remains visible and the failure gives the user a way
  to dismiss or retry it

### Requirement: Tags are inspectable, renameable, and mergeable

The client SHALL list fixture tags with their current record counts and let a
user rename a tag. Before merging a source tag into a target tag, the client
SHALL preview the records and resulting count that will be affected; a
confirmed merge SHALL remove the source tag and update its target count.

#### Scenario: merge preview qualifies the affected result

- **WHEN** a user selects distinct source and target tags for a merge
- **THEN** the page displays the source, target, affected records, and the
  target's resulting count before confirmation

#### Scenario: merge executes only after confirmation

- **WHEN** a user confirms a merge preview
- **THEN** the source tag is absent and the target tag count reflects the
  merged fixture records

### Requirement: Tag filters remain addressable in search

The client SHALL make an optional selected fixture tag part of the search URL
and restrict result rows to records carrying that tag. Clearing the selection
SHALL remove the URL parameter and restore unfiltered fixture results.

#### Scenario: a tag-filtered URL restores the same result set

- **WHEN** a user opens a search URL with a valid tag parameter
- **THEN** the tag control and displayed fixture results match that tag

#### Scenario: clearing a tag filter restores all matching records

- **WHEN** a user clears the selected tag from search
- **THEN** the address has no tag parameter and results are no longer narrowed
  by tag

### Requirement: Fixture integration is visibly bounded

Until the generated Platform contract declares the user-content operations and
capability names, the client SHALL use an injectable deterministic fixture
seam for collections and tags. It SHALL not issue an undeclared Edge API call
or claim that a server capability gate exists.

#### Scenario: the pending integration state is explicit

- **WHEN** a user opens a fixture curation view
- **THEN** the view states that server integration and capability gating are
  pending rather than presenting fixture mutations as persisted archive state
