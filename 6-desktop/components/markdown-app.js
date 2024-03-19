import { registerComponent, Signal } from 'runtime';

let marked;

registerComponent('markdown-app', ({ render, attributes }) => {
  marked = marked ?? Promise.all([
    import('https://esm.run/marked'),
    new Promise(resolve => setTimeout(resolve, 1500)),
  ]).then(([marked]) => marked);
  const content = attributes.file?.value?.content ?? '';

  const loadingMessage = new Signal('Loading markdown renderer...');
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
  ${loadingMessage}
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
