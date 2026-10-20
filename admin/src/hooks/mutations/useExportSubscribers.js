import { useMutation } from '@tanstack/react-query';
import { collectPages } from '../../api/collectPages.js';
import { listSubscribers } from '../../api/newsletter.api.js';
import { toCsv } from '../../lib/csv.js';
import { saveBlob } from '../../lib/download.js';
import { getIstDateOnly } from '../../lib/format.js';

const COLUMNS = [
  { header: 'Email', value: (subscriber) => subscriber.email },
  { header: 'Subscribed at (UTC)', value: (subscriber) => subscriber.createdAt },
];

// The byte-order mark tells spreadsheet apps the file is UTF-8.
const BOM = '\uFEFF';

// Reads every page of subscribers and saves them as one CSV file. Resolves to the count.
export const useExportSubscribers = () =>
  useMutation({
    mutationFn: async () => {
      const subscribers = await collectPages(listSubscribers, 'subscribers');
      const csv = `${BOM}${toCsv(COLUMNS, subscribers)}\r\n`;
      saveBlob(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        `adventuro-newsletter-${getIstDateOnly()}.csv`,
      );
      return subscribers.length;
    },
  });
