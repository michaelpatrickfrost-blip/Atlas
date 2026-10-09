import {describe,expect,it} from 'vitest';
import {MODEL_FIELDS} from '@/server/data-api/model-metadata';
describe('Private platform counter boundary',()=>{it('keeps authentication attempt counters out of business gateway metadata',()=>{expect(MODEL_FIELDS).not.toHaveProperty('AuthenticationRateLimit');});});
