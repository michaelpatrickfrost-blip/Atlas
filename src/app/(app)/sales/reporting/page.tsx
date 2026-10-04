import {redirect} from 'next/navigation';
/** Analytics belong to the planned Reporting app; retain bookmarked route compatibility. */
export default function SalesReporting(){redirect('/sales/orders');}
