const acceptInvitationRoute = '/accept';

export const buildInvitationAcceptUrl = (invitationId: string) =>
  new URL(`${acceptInvitationRoute}/${invitationId}`, window.location.origin);

export const buildInvitationAuthPath = (invitationId: string, oneTimeToken: string) =>
  `/api/invitations/${encodeURIComponent(invitationId)}/auth?${new URLSearchParams({
    one_time_token: oneTimeToken,
  }).toString()}`;
