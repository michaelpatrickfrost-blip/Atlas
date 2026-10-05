const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
type Values = { name: string; question: string; lowLabel: string; highLabel: string; reasons: string[]; followUpQuestion: string; lowFollowUpQuestion: string; thanksText: string; emailSubject: string; emailIntro: string };

/** Every editable part of a survey, in the order the customer meets it. */
export function SurveyFields({ survey }: { survey?: Values }) {
  return <div className="space-y-5">
    <label className="block text-xs font-medium">Survey name (only you see this)<input name="name" required maxLength={150} defaultValue={survey?.name} placeholder="After a delivery" className={field} /></label>
    <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-xs font-semibold text-slate-500">The email</legend>
      <label className="block text-xs font-medium">Subject<input name="emailSubject" maxLength={200} defaultValue={survey?.emailSubject} placeholder="How was your delivery from {{company.name}}?" className={field} /></label>
      <label className="block text-xs font-medium">Opening message<textarea name="emailIntro" rows={4} maxLength={2000} defaultValue={survey?.emailIntro} placeholder={"Hello {{contact.firstName}},\n\nYour order {{order.reference}} has been delivered. It takes one tap to tell us how it went."} className={field} /></label>
      <p className="text-xs text-slate-500">Merge fields: {"{{contact.firstName}}"}, {"{{customer.name}}"}, {"{{company.name}}"}, {"{{order.reference}}"}, {"{{quote.reference}}"}, {"{{invoice.reference}}"}, {"{{case.number}}"}. The 1 to 5 buttons are added under your message.</p>
    </fieldset>
    <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-xs font-semibold text-slate-500">The question</legend>
      <label className="block text-xs font-medium">Question<input name="question" required maxLength={300} defaultValue={survey?.question} placeholder="How was your delivery?" className={field} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium">What 1 means<input name="lowLabel" maxLength={40} defaultValue={survey?.lowLabel ?? "Very unhappy"} className={field} /></label>
        <label className="block text-xs font-medium">What 5 means<input name="highLabel" maxLength={40} defaultValue={survey?.highLabel ?? "Very happy"} className={field} /></label>
      </div>
    </fieldset>
    <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-xs font-semibold text-slate-500">After they score</legend>
      <label className="block text-xs font-medium">Things they can tick, one per line<textarea name="reasons" rows={6} defaultValue={survey?.reasons.join("\n")} placeholder={"Arrived when promised\nCondition of the goods\nKept informed"} className={field} /><span className="mt-1 block font-normal text-slate-500">Up to twelve. These become the reasons you can report on.</span></label>
      <label className="block text-xs font-medium">Question for a score of 4 or 5<input name="followUpQuestion" maxLength={300} defaultValue={survey?.followUpQuestion ?? "What did we do well?"} className={field} /></label>
      <label className="block text-xs font-medium">Question for a score of 3 or lower<input name="lowFollowUpQuestion" maxLength={300} defaultValue={survey?.lowFollowUpQuestion ?? "Sorry it fell short. What went wrong, so we can put it right?"} className={field} /></label>
      <label className="block text-xs font-medium">Thank-you message<input name="thanksText" maxLength={300} defaultValue={survey?.thanksText ?? "Thank you for your feedback."} className={field} /></label>
    </fieldset>
  </div>;
}
