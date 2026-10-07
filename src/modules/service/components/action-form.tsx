import { ActionForm as SharedActionForm } from '@/components/ui/action-form';
export function ActionForm(props:React.ComponentProps<typeof SharedActionForm>){return <SharedActionForm {...props} className={`space-y-3 ${props.className??''}`} label={props.label??'Save'}/>;}
