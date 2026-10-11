import { PROMISE_STEPS } from '../../lib/aboutContent.js';

// The brand promise, in its order: Discover, Experience, Equip, Remember.
export function PromiseSteps() {
  return (
    <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {PROMISE_STEPS.map(({ name, text }, index) => (
        <li key={name} className="flex gap-4">
          <span aria-hidden="true" className="text-h3 leading-none font-extrabold text-brand-text">
            {index + 1}
          </span>
          <p className="flex flex-col gap-1">
            <span className="font-extrabold">{name}</span>
            <span className="text-text-muted">{text}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}
