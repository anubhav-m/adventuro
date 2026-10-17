import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DRAFT_TOUR, TAXONOMIES, TOUR, TOUR_LIST } from '../../test/fixtures.js';
import { renderApp } from '../../test/render.jsx';
import { api, failure, server, success } from '../../test/server.js';
import { Field } from '../ui/Field.jsx';
import { TaxonomySelect } from './TaxonomySelect.jsx';
import { TourMultiSelect } from './TourMultiSelect.jsx';

const serveTaxonomies = () => {
  const types = [];
  server.use(
    http.get(api('/admin/taxonomies'), ({ request }) => {
      const type = new URL(request.url).searchParams.get('type');
      types.push(type);
      return success({ taxonomies: TAXONOMIES[type] });
    }),
  );
  return types;
};

const Picker = ({ Component, label, initial, onChange, ...props }) => {
  const [value, setValue] = useState(initial);
  return (
    <Field label={label}>
      {(control) => (
        <Component
          {...control}
          {...props}
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      )}
    </Field>
  );
};

describe('TaxonomySelect', () => {
  it('offers one type’s items and hands back the chosen id', async () => {
    const user = userEvent.setup();
    const types = serveTaxonomies();
    const onChange = vi.fn();
    renderApp(
      <Picker
        Component={TaxonomySelect}
        type="category"
        label="Category"
        initial=""
        onChange={onChange}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Category' });

    await waitFor(() => expect(select).toBeEnabled());
    expect([...select.options].map((option) => option.text)).toEqual([
      'Choose one',
      'Backpacks',
      'Water Gear',
    ]);
    await user.selectOptions(select, 'Water Gear');

    expect(onChange).toHaveBeenCalledWith('cat-water');
    expect(types).toEqual(['category']);
  });

  it('chooses several when `multiple`', async () => {
    const user = userEvent.setup();
    serveTaxonomies();
    const onChange = vi.fn();
    renderApp(
      <Picker
        Component={TaxonomySelect}
        type="climate"
        multiple
        label="Climates"
        initial={['clim-snow']}
        onChange={onChange}
      />,
    );

    expect(
      await screen.findByRole('button', { name: 'Remove High Altitude/Snow' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Climates' }));
    await user.click(screen.getByRole('checkbox', { name: 'Tropical/Beach' }));

    expect(onChange).toHaveBeenLastCalledWith(['clim-snow', 'clim-beach']);
  });

  it('says so when the list cannot load', async () => {
    server.use(http.get(api('/admin/taxonomies'), () => failure(500, 'INTERNAL_ERROR')));
    renderApp(
      <Picker
        Component={TaxonomySelect}
        type="tag"
        multiple
        label="Tags"
        initial={[]}
        onChange={vi.fn()}
      />,
    );

    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
  });
});

describe('TourMultiSelect', () => {
  it('loads every page of tours and narrows them by what is typed', async () => {
    const user = userEvent.setup();
    const pages = [];
    server.use(
      http.get(api('/admin/tours'), ({ request }) => {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page'));
        pages.push([page, searchParams.get('limit')]);
        return success(
          { tours: [TOUR_LIST[page - 1]] },
          { meta: { page, limit: 1, total: 2, totalPages: 2 } },
        );
      }),
    );
    const onChange = vi.fn();
    renderApp(
      <Picker Component={TourMultiSelect} label="Linked tours" initial={[]} onChange={onChange} />,
    );

    const button = screen.getByRole('button', { name: 'Linked tours' });
    await waitFor(() => expect(button).toHaveTextContent('Choose tours'));
    expect(pages).toEqual([
      [1, '50'],
      [2, '50'],
    ]);

    await user.click(button);
    expect(screen.getByRole('checkbox', { name: `${TOUR.title} · TideTrail` })).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Filter options' }), 'peak');
    expect(
      screen.queryByRole('checkbox', { name: `${TOUR.title} · TideTrail` }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('checkbox', { name: `${DRAFT_TOUR.title} · PeakPulse (draft)` }),
    );

    expect(onChange).toHaveBeenLastCalledWith([DRAFT_TOUR.id]);
  });

  it('says so when the tours cannot load', async () => {
    server.use(http.get(api('/admin/tours'), () => failure(500, 'INTERNAL_ERROR')));
    renderApp(
      <Picker Component={TourMultiSelect} label="Linked tours" initial={[]} onChange={vi.fn()} />,
    );

    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
  });
});
