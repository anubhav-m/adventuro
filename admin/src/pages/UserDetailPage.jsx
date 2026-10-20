import { ArrowLeft } from 'lucide-react';
import { useId } from 'react';
import { useParams } from 'react-router';
import { BookingsTable } from '../components/bookings/BookingsTable.jsx';
import { DocumentLoader } from '../components/layout/DocumentLoader.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { UserProfile } from '../components/users/UserProfile.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useUser } from '../hooks/queries/useUsers.js';
import { ROUTES } from '../lib/constants.js';

// Read-only: a user's account and their 50 most recent bookings.
export function UserDetailPage() {
  const { id } = useParams();
  const query = useUser(id);
  const bookingsId = useId();

  return (
    <DocumentLoader query={query} title="User">
      {({ user, bookings }) => (
        <>
          <PageHeader
            title={user.name}
            description={user.email}
            actions={
              <Button variant="ghost" icon={ArrowLeft} to={ROUTES.USERS}>
                All users
              </Button>
            }
          />
          <UserProfile user={user} />
          <section aria-labelledby={bookingsId} className="flex flex-col gap-3">
            <h2 id={bookingsId} className="text-body font-extrabold">
              Bookings
            </h2>
            <BookingsTable
              caption={`${user.name}’s bookings`}
              rows={bookings}
              showCustomer={false}
              empty="No bookings yet."
            />
          </section>
        </>
      )}
    </DocumentLoader>
  );
}
