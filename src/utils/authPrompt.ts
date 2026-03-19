export const AUTH_REQUIRED_EVENT = 'app:auth-required';

type AuthRequiredDetail = {
  from?: string;
};

export function showAuthRequiredPrompt(from?: string) {
  window.dispatchEvent(
    new CustomEvent<AuthRequiredDetail>(AUTH_REQUIRED_EVENT, {
      detail: { from },
    })
  );
}
