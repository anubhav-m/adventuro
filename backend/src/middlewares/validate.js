import { ZodError } from 'zod';

const SOURCES = ['body', 'query', 'params'];

// Parses every provided source so one response reports all failing fields.
export const validate = (schemas) => (req, _res, next) => {
  const validated = {};
  const issues = [];

  SOURCES.filter((source) => schemas[source]).forEach((source) => {
    const result = schemas[source].safeParse(req[source] ?? {});
    if (result.success) validated[source] = result.data;
    else issues.push(...result.error.issues);
  });

  if (issues.length > 0) return next(new ZodError(issues));
  req.validated = validated;
  return next();
};
