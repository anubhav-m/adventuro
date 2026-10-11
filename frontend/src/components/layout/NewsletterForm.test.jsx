import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render.jsx';
import { api, failure, server, success } from '../../test/server.js';
import { NewsletterForm } from './NewsletterForm.jsx';

const SUCCESS = "You're on the list!";

const setup = () => {
  renderApp(<NewsletterForm />);
  return userEvent.setup();
};

const emailField = () => screen.getByRole('textbox', { name: 'New trips and gear, by email' });

const submit = async (user, email) => {
  await user.clear(emailField());
  if (email) await user.type(emailField(), email);
  await user.click(screen.getByRole('button', { name: 'Subscribe' }));
};

// Counts requests so a test can prove the server was (or was not) called.
const respond = (resolver) => {
  const received = [];
  server.use(
    http.post(api('/newsletter'), async ({ request }) => {
      received.push(await request.json());
      return resolver();
    }),
  );
  return received;
};

describe('NewsletterForm', () => {
  it('subscribes, shows the success message and clears the field', async () => {
    const received = respond(() => success(undefined, { message: 'Subscribed' }));
    const user = setup();
    await submit(user, 'reader@example.com');

    expect(await screen.findByText(SUCCESS)).toBeInTheDocument();
    expect(received).toEqual([{ email: 'reader@example.com' }]);
    await waitFor(() => expect(emailField()).toHaveValue(''));
  });

  it('shows the identical message whether the email is new or already subscribed', async () => {
    // The API answers both cases with the same 200; the form must not tell them apart either.
    respond(() => success(undefined, { message: 'Subscribed' }));
    const user = setup();

    await submit(user, 'new@example.com');
    expect(await screen.findAllByText(SUCCESS)).toHaveLength(1);
    await submit(user, 'new@example.com');
    await waitFor(() => expect(screen.getAllByText(SUCCESS)).toHaveLength(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks for an email when the field is empty, without calling the API', async () => {
    const received = respond(() => success());
    const user = setup();
    await submit(user, '');

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your email address.');
    expect(emailField()).toBeInvalid();
    expect(emailField()).toHaveAccessibleDescription('Enter your email address.');
    expect(received).toEqual([]);
  });

  it.each(['reader', 'reader@', 'reader@example', '@example.com'])(
    'rejects "%s" without calling the API',
    async (email) => {
      const received = respond(() => success());
      const user = setup();
      await submit(user, email);

      expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.');
      expect(received).toEqual([]);
    },
  );

  it('shows our own wording when the server rejects the email', async () => {
    respond(() =>
      failure(400, 'VALIDATION_ERROR', { errors: [{ field: 'email', message: 'Invalid email' }] }),
    );
    const user = setup();
    await submit(user, 'reader@example.com');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Enter a valid email address.');
    expect(alert).not.toHaveTextContent('Invalid email');
    expect(screen.queryByText(SUCCESS)).not.toBeInTheDocument();
  });

  it('explains a rate limit and a network failure in our own words', async () => {
    respond(() => failure(429, 'RATE_LIMITED'));
    const user = setup();
    await submit(user, 'reader@example.com');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "You're going a bit fast. Please wait a moment and try again.",
    );
    expect(emailField()).toHaveValue('reader@example.com');

    respond(() => HttpResponse.error());
    await submit(user, 'reader@example.com');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        "We can't reach Adventuro right now. Check your connection and try again.",
      ),
    );
  });

  it('clears an earlier server error once a later attempt succeeds', async () => {
    respond(() => failure(500, 'INTERNAL_ERROR'));
    const user = setup();
    await submit(user, 'reader@example.com');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    respond(() => success());
    await submit(user, 'reader@example.com');
    expect(await screen.findByText(SUCCESS)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
