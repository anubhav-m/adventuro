import { useReveal } from '../../hooks/useReveal.js';

// A block that rises into place as it scrolls onto the screen, and again each time the page
// comes back down to it. With `stagger` its direct children rise one after another instead (a
// grid of cards). The motion lives in `styles/index.css`, keyed on the two data attributes.
export function Reveal({ as: Tag = 'div', stagger = false, children, ...rest }) {
  const [ref, revealed] = useReveal();

  return (
    <Tag
      ref={ref}
      data-reveal={stagger ? 'stagger' : 'rise'}
      data-revealed={revealed || undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
