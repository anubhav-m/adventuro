import { Controller } from 'react-hook-form';

// One list of the surrounding react-hook-form form, drawn by `render(field, error)`: the list
// editors take a value, an onChange and the form's error for the list.
export function ListField({ name, render }) {
  return (
    <Controller name={name} render={({ field, fieldState }) => render(field, fieldState.error)} />
  );
}
