/** Return expected validation feedback explicitly; Next redacts thrown server errors in production. */
export type FormFeedback={error:string};
export async function withFormFeedback(work:()=>Promise<void>):Promise<void|FormFeedback> {
  try { await work(); }
  catch(error) {
    if(error instanceof Error&&"digest" in error&&String(error.digest).startsWith("NEXT_REDIRECT"))throw error;
    // Ordinary domain errors contain intentional guidance. Driver/framework errors may contain private detail.
    if(error instanceof Error&&error.constructor===Error)return {error:error.message};
    return {error:"Could not save these changes. Refresh and try again; if this continues, contact your administrator."};
  }
}
