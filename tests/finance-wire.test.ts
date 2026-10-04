import {it,expect} from 'vitest';
import {Decimal} from '@prisma/client/runtime/client';
import {encodeWire,decodeWire} from '@/core/desktop/wire';
it('transports monetary rates and quantities without relying on class names',async()=>{const original={amount:9007199254740993n,rate:new Decimal('1.234567890123'),quantity:new Decimal('0.000001')};const value=decodeWire(await encodeWire(original));expect(value).toEqual({amount:9007199254740993n,rate:'1.234567890123',quantity:'0.000001'});});
