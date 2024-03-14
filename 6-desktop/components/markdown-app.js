import { registerComponent, State } from 'runtime';

registerComponent('markdown-app', ({ render, attributes }) => {
  const marked = import('https://esm.run/marked');
  const content = attributes.file?.value?.content ?? '';

  const loadingMessage = new State('Rendering markdown...');
  render`
<style>
:host {
  width: inherit;
  height: inherit;
}

section {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<section>
  Loading content...
</section>
  `;

  marked.then(marked => {
    render`
<style>
section {
  padding: 5px;
}

h1:first-of-type {
  margin-top: 0;
}
img {
  display: block;
  margin: 0 auto;
  max-width: 50%;
}
</style>
<section>
  ${marked.parse(content)}
</section>
  `;
  }).catch(e => {
    console.error(e);
    loadingMessage.value = 'Failed to load markdown renderer; check the console for details.';
  });
});
