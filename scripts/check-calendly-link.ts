/**
 * Fail the production build when the browser salary reply would ship without
 * a usable booking link. Next inlines NEXT_PUBLIC_CALENDLY_LINK at build time.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { httpsBookingLink } from '../lib/input-filter';

config({ path: resolve(process.cwd(), '.env.local'), quiet: true });
config({ path: resolve(process.cwd(), '.env'), quiet: true });

if (!httpsBookingLink(process.env.NEXT_PUBLIC_CALENDLY_LINK)) {
  console.error(
    'NEXT_PUBLIC_CALENDLY_LINK must be an https URL with a hostname before building. The browser salary reply inlines this value.',
  );
  process.exit(1);
}
