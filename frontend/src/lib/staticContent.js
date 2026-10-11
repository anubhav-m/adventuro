import { BRAND, ROUTES } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER LEGAL COPY — FOR CLIENT REVIEW.
// Nothing below has been reviewed by a lawyer or approved by the client. It describes how the
// prototype behaves today (Google sign-in, bookings without payment, affiliate gear links) in
// plain words, and must be replaced or approved before launch. Each page shows REVIEW_NOTICE
// until then: remove the notice only when the copy is final.
// ─────────────────────────────────────────────────────────────────────────────────────────

export const REVIEW_NOTICE = 'Draft copy, awaiting client and legal review';

// Keyed by route path. A section has `paragraphs`, and optionally `items` (a bulleted list).
export const STATIC_PAGES = Object.freeze({
  [ROUTES.PRIVACY_TERMS]: {
    title: 'Privacy & Terms',
    lead: 'What we collect, why, and the terms of using this site.',
    sections: [
      {
        title: 'What we collect',
        paragraphs: [`When you use ${BRAND.NAME} we keep only what a booking needs.`],
        items: [
          'From Google sign-in: your name, email address and profile photo.',
          'From you: your mobile number, and the theme you choose for the site.',
          'From your bookings: the trip, package, number of travelers and start date.',
          'From the newsletter form: your email address, if you subscribe.',
          'From gear links: a count of clicks on each product. It is not tied to your account.',
        ],
      },
      {
        title: 'How we use it',
        paragraphs: [
          'Your name, phone number and email address go on your ticket, so the trip team can reach you before and during the trip.',
          'We do not sell your details. We share them only with the people running the trip you booked.',
        ],
      },
      {
        title: 'Cookies',
        paragraphs: [
          'We set one cookie, which keeps you signed in. Your theme choice and a booking you have not finished are kept in your browser’s own storage.',
        ],
      },
      {
        title: 'Using the site',
        paragraphs: [
          `A booking on ${BRAND.NAME} reserves a trip in your name. No payment is taken on this site.`,
          'Trip details, prices, and reporting times and locations can change. Your ticket always shows the current reporting details.',
          'Gear is sold by other stores, under their own terms.',
        ],
      },
      {
        title: 'Your choices',
        paragraphs: [
          'You can correct your name and phone number on your account page at any time. To have your account or your data removed, write to us.',
        ],
      },
    ],
  },
  [ROUTES.CANCELLATION_REFUND]: {
    title: 'Cancellation & Refund',
    lead: 'How to cancel a booking, and what happens to it.',
    sections: [
      {
        title: 'Cancelling a booking',
        paragraphs: [
          'Bookings cannot be cancelled from the site. To cancel, write to us with your booking number, and our team will cancel it for you.',
          'A cancelled booking stays in My Bookings, marked Cancelled, and its ticket is no longer valid for travel.',
        ],
      },
      {
        title: 'Refunds',
        paragraphs: [
          'No payment is taken when you confirm a booking on this site, so a cancellation here has nothing to refund.',
          'Anything you have paid to the trip team directly is handled under the terms they gave you at the time.',
        ],
      },
      {
        title: 'If we change or cancel a trip',
        paragraphs: [
          'Weather, safety and local conditions can change a trip or its signature activity. If we have to cancel or move a trip, we contact you on the phone number on your ticket.',
        ],
      },
    ],
  },
  [ROUTES.AFFILIATE_DISCLOSURE]: {
    title: 'Affiliate Disclosure',
    lead: 'How the gear store works, and how we earn from it.',
    sections: [
      {
        title: 'Gear links are affiliate links',
        paragraphs: [
          `${BRAND.NAME} does not sell gear. Every Buy button opens the product on another store’s site, in a new tab.`,
          'If you buy there, we may earn a commission from that store. It does not change the price you pay.',
        ],
      },
      {
        title: 'What we recommend',
        paragraphs: [
          'We list gear because it suits a kind of trip, a climate, or a specific tour. A recommendation is not a guarantee, and gear is never part of a booking or its total.',
        ],
      },
      {
        title: 'Orders, delivery and returns',
        paragraphs: [
          'Your order is with the store you buy from. Prices, stock, delivery, returns and warranties are theirs, and the price on their site is the one that applies.',
        ],
      },
    ],
  },
});
