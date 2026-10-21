import { expect, it } from "vitest";
import { createdTicketUrl } from "../scripts/studio/ticket-urls";
it.each(["https://atlassystem.online", "http://127.0.0.1:3011"])("waits for a real record route on %s", base => {
  const expected = createdTicketUrl(base);
  expect(expected.test(`${base}/tickets/create`)).toBe(false);
  expect(expected.test(`${base}/tickets/create?retry=1`)).toBe(false);
  expect(expected.test(`${base}/tickets/cmutjnkqz000tdus6zrav39du`)).toBe(true);
  expect(expected.test(`${base}/tickets/20000000-0000-4000-8000-000000000001`)).toBe(true);
  expect(expected.test(`${base}/login`)).toBe(false);
  expect(expected.test(`https://another.example/tickets/cmutjnkqz000tdus6zrav39du`)).toBe(false);
  expect(expected.test(`https://bad.example/${base}/tickets/cmutjnkqz000tdus6zrav39du`)).toBe(false);
});
