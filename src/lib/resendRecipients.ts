/**
 * Avec un expéditeur test Resend (`onboarding@resend.dev`), les envois ne sont
 * acceptés que vers l’email du compte Resend — pas vers CONTACT_EMAIL arbitraire.
 * @see https://resend.com/docs
 */
export function isResendSandboxFromAddress(from: string): boolean {
  return from.toLowerCase().includes('onboarding@resend.dev');
}

export function resolveDevOrSandboxRecipient(params: {
  productionRecipient: string;
  fromAddress: string;
  isProduction: boolean;
}): { to: string; redirected: boolean; configError?: string } {
  const { productionRecipient, fromAddress, isProduction } = params;

  if (isProduction) {
    return { to: productionRecipient, redirected: false };
  }

  if (isResendSandboxFromAddress(fromAddress)) {
    const sandbox = process.env.RESEND_TEST_RECIPIENT?.trim();
    if (!sandbox) {
      return {
        to: '',
        redirected: false,
        configError:
          'En développement, avec l’expéditeur test Resend (onboarding@resend.dev), définissez RESEND_TEST_RECIPIENT avec l’email de votre compte Resend (voir message d’erreur Resend). En production, vérifiez un domaine sur resend.com/domains et définissez RESEND_FROM_EMAIL.',
      };
    }
    return {
      to: sandbox,
      redirected: sandbox.toLowerCase() !== productionRecipient.toLowerCase(),
    };
  }

  const devFallback =
    process.env.RESEND_TEST_RECIPIENT?.trim() || process.env.CONTACT_EMAIL?.trim();
  const to = devFallback || productionRecipient;
  return { to, redirected: to.toLowerCase() !== productionRecipient.toLowerCase() };
}
