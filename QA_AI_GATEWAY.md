# QA Manuel - AI Gateway GL Capital

Cette checklist valide les chemins critiques de `POST /api/ai-gateway` avant mise en production.

## Prerequis

- Etre connecte a un compte autorise dans le portail client.
- Disposer de `OPENAI_API_KEY` configuree pour les tests nominaux.
- Ouvrir la page `client-dashboard/ai-assistant`.

## Cas 1 - Requete hors domaine (blocked)

- **Action**: envoyer un message hors scope (ex: "Donne-moi une recette de cuisine rapide").
- **Attendu API**:
  - `status: 200`
  - `success: true`
  - `blocked: true`
  - `reply` contient un recentrage GL Capital.
- **Attendu UI**:
  - le message assistant refuse poliment le hors domaine.
  - aucun crash, aucun message d'erreur technique.

## Cas 2 - Rate limit

- **Action**: envoyer rapidement plus de 20 messages en moins d'une minute depuis la meme IP/session.
- **Attendu API**:
  - `status: 429`
  - `code: RATE_LIMITED`
  - header `Retry-After` present.
  - header `X-Request-Id` present.
- **Attendu UI**:
  - message clair du type "Trop de requetes...".
  - `Request ID` visible dans l'interface.

## Cas 3 - Erreur provider IA

- **Preparation**: rendre temporairement la configuration provider invalide (ex: cle invalide ou `AI_GATEWAY_BASE_URL` incorrecte).
- **Action**: envoyer une question valide domaine GL Capital.
- **Attendu API**:
  - `status: 502` (provider) ou `500` (configuration manquante)
  - `code` coherent (`PROVIDER_ERROR`, `EMPTY_PROVIDER_RESPONSE` ou `MISSING_PROVIDER_CONFIG`)
  - `X-Request-Id` present.
- **Attendu UI**:
  - message utilisateur comprehensible (pas de stack trace brute).
  - `Request ID` affiche pour support.

## Cas 4 - Nominal domaine GL Capital

- **Action**: envoyer une question metier (ex: "Quels documents KYC pour une entreprise?").
- **Attendu API**:
  - `status: 200`
  - `success: true`
  - `blocked: false`
  - `reply` non vide.
- **Attendu UI**:
  - reponse utile, ton institutionnel.
  - aucune promesse de garantie de resultat.

## Verification logs serveur

- Verifier dans les logs:
  - trace de succes avec `requestId`, `userId`, `model`, `elapsedMs`.
  - trace d'erreur provider avec `requestId` et statut HTTP provider.
  - trace d'acces non autorise si appel sans session.

## Go/No-Go rapide

- **GO** si tous les cas ci-dessus passent sans regression UI.
- **NO-GO** si:
  - hors domaine non bloque,
  - erreurs 5xx sans `requestId`,
  - ou message utilisateur incomprehensible en cas d'echec.
