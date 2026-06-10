/**
 * Avec l'expéditeur test Resend (`onboarding@resend.dev`), les envois ne sont
 * acceptés que vers l'email du compte Resend — pas vers des adresses arbitraires.
 * Avec un domaine vérifié (`RESEND_FROM_EMAIL`), les envois vont au vrai destinataire.
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

  // Domaine vérifié configuré → envoi réel vers le destinataire prévu (dev et prod)
  if (!isResendSandboxFromAddress(fromAddress)) {
    return { to: productionRecipient, redirected: false };
  }

  // Production sans domaine vérifié
  if (isProduction) {
    return {
      to: '',
      redirected: false,
      configError:
        'Définissez RESEND_FROM_EMAIL avec un domaine vérifié sur resend.com/domains (onboarding@resend.dev ne permet pas d’envoyer aux visiteurs).',
    };
  }

  // Dev + expéditeur test Resend uniquement
  const sandbox = process.env.RESEND_TEST_RECIPIENT?.trim();
  if (!sandbox) {
    return {
      to: '',
      redirected: false,
      configError:
        'En développement sans domaine vérifié, définissez RESEND_TEST_RECIPIENT (email du compte Resend) ou configurez RESEND_FROM_EMAIL avec un domaine vérifié pour envoyer aux visiteurs.',
    };
  }
  return {
    to: sandbox,
    redirected: sandbox.toLowerCase() !== productionRecipient.toLowerCase(),
  };
}
