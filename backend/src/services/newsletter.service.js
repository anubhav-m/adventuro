import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';

export const subscribe = async (email) => {
  await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
};
