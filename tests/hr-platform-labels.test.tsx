// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock('@/app/(app)/people/platform-actions',()=>({saveVacancy:vi.fn(),saveApplication:vi.fn(),saveTraining:vi.fn(),saveHRDocument:vi.fn()}));
import {VacancyForm,ApplicationForm} from '@/modules/people/components/recruitment-form';
import {RegisterForm} from '@/modules/people/components/register-form';
afterEach(cleanup);
it('vacancy owner has an exact accessible name independent of option content',()=>{render(<VacancyForm owners={[{userId:'hr',user:{name:'HR Manager'}}]}/>);expect(screen.getByRole('combobox',{name:'Hiring owner'})).toBeDefined();expect(screen.getByRole('combobox',{name:'Vacancy status'})).toBeDefined();});
it('applicant vacancy has an exact accessible name',()=>{render(<ApplicationForm vacancies={[{id:'v',title:'Operator'}]}/>);expect(screen.getByRole('combobox',{name:'Vacancy'})).toBeDefined();});
it('training labels remain exact when employee options and saved notes are populated',()=>{render(<RegisterForm kind="training" employees={[{id:'e',firstName:'Alex',lastName:'Smith'}]}/>);expect(screen.getByRole('combobox',{name:'Employee'})).toBeDefined();expect(screen.getByRole('combobox',{name:'Status'})).toBeDefined();expect(screen.getByLabelText('Completion evidence and notes',{exact:true})).toBeDefined();});
