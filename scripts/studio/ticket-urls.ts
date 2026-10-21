/** Browser creation must leave the reserved form URL before a record ID is read.
 * `/tickets/create` itself matched the former alphanumeric-record expression. */
export function createdTicketUrl(base: string): RegExp {
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}/tickets/(?!create$)[a-zA-Z0-9_-]+$`);
}
