## Content

### tooltip

tooltip component to learning web components & shadow dom

### todo

- index.html - basic todo app to find runtime patterns
- app - iterating on development patterns
- app2 - continued iterating

### calc

- introduced script usage in html file
- added component`` tagged template literal for assigning handler functions that can interact with the component state
- added event pattern

## Challenges

- indentation whitespace is reflected in HTML
  - `html` trims whitespace at the beginning and end of lines
  - component html has leading & trailing whitespace removed from each line, and reduces to a single line
- no live NodesList / nodeless "container" concept
  - how to mount & maintain an array of nodes without introducing a wrapping element
    - created ContainedNodeArray class
