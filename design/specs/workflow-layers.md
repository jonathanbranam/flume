# Workflow layers

flume's workflow text is made of Markdown documents that ship with flume and that the tasks repository can change, heading by heading. This spec covers the documents, the layers, the merge rule and the check. Where each document is shown is in the agent, workflow, instructions and api specs. Ticket: fl-mv4r.

Assumptions (recorded on fl-mv4r): flume enforces the rules below and does not run a Markdown linter; a heading is a line starting with number signs (underlined headings are errors); comment lines above the H1 are allowed and dropped; one blank line separates the parts of a merged document; a guide's front matter is not merged.

## Requirements

### Requirement: The documents and their layers  {#r-8072}
flume SHALL ship the documents workflow.md, phases.md, project.md, first-prompt.md and templates/PART.md (PART being body, design, spec or plan), and for each of these and for roles/ROLE.md and guides/NAME.md SHALL merge the files of that name that exist, in this order, each into the result of those before it: the one flume ships, the one in base of the flume root, and the one in projects/PROJECT of the flume root (when a project is known). With no file in the flume root, flume SHALL use the shipped document word for word.

#### Scenario: No layers  {#s-40bc}
*Verification*: **executable**
- **GIVEN** a running daemon whose flume root has no layered files
- **WHEN** the user runs flume prime for project web, flume task instructions for a new task, flume task template for each part, and flume agent with no prompt
- **THEN** each shows the shipped documents word for word (placeholders and the task ID filled), and claude's last argument is the text under the H1 of the shipped first prompt

### Requirement: Replace is the default  {#r-2cff}
When a heading of a layer has no tag, flume SHALL match it against the layers below by its path (the H1, then the H2 under it, and so on), ignoring case and surrounding spaces; its own text (between it and its first sub-heading) SHALL replace the matched section's own text, its sub-headings SHALL be handled one by one by the same rules, and sections below that it does not mention SHALL stay.

#### Scenario: Replace a section's own text  {#s-c78c}
*Verification*: **executable**
- **GIVEN** a lower document with a section One holding text and a sub-section Deep
- **WHEN** a layer holds the heading one with other text
- **THEN** the merged section One holds the new text, Deep is unchanged and so is every other section

#### Scenario: A heading as a path  {#s-3680}
*Verification*: **executable**
- **GIVEN** a lower document with a section One holding text and a sub-section Deep
- **WHEN** a layer holds the heading One with no text and the sub-heading Deep with other text
- **THEN** the text of One stays and the text of Deep is replaced

### Requirement: Tags add, append, remove or replace  {#r-8bd3}
When a heading ends with @add, @append, @remove or @replace, flume SHALL strip the tag from the output and, respectively: add the section with its sub-sections at the end of its parent; add its text after the matched section's text and handle its sub-headings by the usual rules; drop the matched section and all its sub-sections; or put the whole section, sub-sections and all, in place of the matched one.

#### Scenario: Each tag  {#s-f12e}
*Verification*: **executable**
- **GIVEN** a lower document with sections One and Two
- **WHEN** layers add a section, append to a section and to the H1, remove a section and replace a whole section
- **THEN** the merged documents hold exactly those changes and no tag

### Requirement: Replace the whole document  {#r-0325}
When a layer's H1 is tagged @replace, flume SHALL use that file alone and SHALL NOT read the layers below it.

#### Scenario: A file that stands alone  {#s-f3d7}
*Verification*: **executable**
- **GIVEN** a lower file that is not even a valid document
- **WHEN** the layer above it has an H1 tagged @replace
- **THEN** the merged document is that layer's file without the tag, with no error

### Requirement: What cannot be placed is an error  {#r-6192}
flume SHALL treat as an error, naming the file, the line and the heading, and SHALL NOT guess at: a file whose first line other than blank and comment lines is not its H1, or with no H1 or a second one; a heading before the H1, one that skips a level, one repeated under the same parent, one with no words and an underlined heading; an unknown @ word at the end of a heading; an untagged, @append, @remove or @replace heading that matches nothing below; @add of a heading that is there already; an untagged, @append or @replace heading with no text and no sub-headings in a layer that merges into another; @remove with text or sub-headings of its own; an H1 that differs from the H1 below, or is tagged @add or @remove; and any tag on a heading with nothing below it to merge into (a sub-heading of an added or replaced section, or a file with no layer below it, whose H1 may only be tagged @replace). Headings inside fenced code blocks and comments are text.

#### Scenario: Each error  {#s-b591}
*Verification*: **executable**
- **GIVEN** a lower document
- **WHEN** layers break each rule in turn
- **THEN** each gives an error naming the layer's file, the line and the heading, and a document with no H1 is also an error

### Requirement: A project's workflow replaces and adds  {#r-8323}
When a project's files override the shipped documents, flume SHALL show the project's agents the merged result.

#### Scenario: Two example overrides  {#s-7fc3}
*Verification*: **executable**
- **GIVEN** a project docs whose workflow.md replaces the whole document, and a project web whose phases.md replaces the Implement section and adds a Review section, with its own first-prompt.md
- **WHEN** flume prime is run for docs, flume task instructions for a web task in implement, flume agent for web with no prompt, and flume check
- **THEN** the docs prime holds only its own workflow text (and the project text), the web steps are its Implement section and Every phase (not the Review section, which is no phase), claude's prompt is the project's first prompt with {name} and {project} filled, and check passes

#### Scenario: A phase with no steps  {#s-0c09}
*Verification*: **executable**
- **GIVEN** a base phases.md that removes the Proposal section
- **WHEN** flume task instructions is run for a task in proposal
- **THEN** the steps say the workflow has no steps for the proposal phase, followed by Every phase

### Requirement: A broken layer stops the command  {#r-fe99}
When a layered file that flume prime, flume agent, flume task instructions, flume task template or flume guide needs has an error, flume SHALL print the errors (file, line and heading) to standard error, print nothing on standard output and exit with code 1.

#### Scenario: Broken layers  {#s-4592}
*Verification*: **executable**
- **GIVEN** a project whose workflow.md, phases.md, body template and a guide each have a heading that matches nothing
- **WHEN** flume prime, flume agent, flume task instructions, flume task template body and flume guide are run
- **THEN** each exits with code 1, names its file, line and heading on standard error and prints nothing else, claude is not started and the history records no instructions

### Requirement: Check reads every layered file  {#r-ba09}
When flume check is run, it SHALL check every layered file in base and in each project's folder of the flume root by the rules above, against the layers below it, and report each error as one problem whose path is the file and whose message holds the line and the heading.

#### Scenario: Errors from every kind of file  {#s-4703}
*Verification*: **executable**
- **GIVEN** errors in a base workflow.md and role, and a project's project.md, first-prompt.md, plan template and guide
- **WHEN** flume check --json and flume check are run
- **THEN** each file is reported with its line, and the text form names the heading

### Requirement: Guides merge by heading  {#r-873d}
When a guide is in both base and a project, flume SHALL merge the project guide's text into the base guide's by these rules and use the project guide's front matter.

#### Scenario: A project adds to a guide  {#s-cac1}
*Verification*: **executable**
- **GIVEN** a base guide with a section A and a project guide of the same name adding a section B
- **WHEN** flume guide is run for the guide and for the list, with the project
- **THEN** the guide holds A and then B, and the list shows the project's description
