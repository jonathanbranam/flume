# Releases

Flume reports which release and commit it is, and prints a bug-report template that carries that
version, so a bug report emailed from another machine can be traced to the code that produced it.

Assumptions (recorded on fl-jc84): the release is the version number in the checkout's package metadata; the commit is the 12-character short id; neither command needs the daemon. Not yet specified: embedding a release tag in the version line (the commit identifies the tag).

## Requirements

### Requirement: version  {#r-3f8a}

When the user runs "flume version", flume SHALL print one line, "<release> (<commit>)", and exit with code 0.

The release is the version number of the checkout. The commit is the short git commit id of the checkout, or "unknown" when flume does not run from a git checkout.

#### Scenario: version in a git checkout  {#s-9b9e}

*Verification*: **executable**

- **GIVEN** flume runs from a git checkout
- **WHEN** the user runs flume with the argument version
- **THEN** the output is one line holding the release number, a space, and the commit id in parentheses
- **AND** the exit code is 0

#### Scenario: version outside a git checkout  {#s-90c6}

*Verification*: **executable**

- **GIVEN** flume runs from a copy that is not a git checkout
- **WHEN** the user runs flume with the argument version
- **THEN** the output is the release number followed by (unknown)

### Requirement: bug report template  {#r-4221}

When the user runs "flume bug", flume SHALL print a bug-report template to standard output and exit with code 0, and the template SHALL contain the same version line that "flume version" prints, and empty sections for the command run, the expected behaviour and the actual behaviour.

#### Scenario: template has the version line  {#s-e49f}

*Verification*: **executable**

- **GIVEN** flume runs from a git checkout
- **WHEN** the user runs flume with the argument bug
- **THEN** the output contains the line printed by flume version
- **AND** the exit code is 0

#### Scenario: template has sections to fill in  {#s-31d3}

*Verification*: **executable**

- **GIVEN** any checkout
- **WHEN** the user runs flume with the argument bug
- **THEN** the output has the headings Command, Expected and Actual, in that order
