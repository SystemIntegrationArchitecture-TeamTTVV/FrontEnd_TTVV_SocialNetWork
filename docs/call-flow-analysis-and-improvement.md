# Call Flow Analysis and Improvement

## 1) Current flow before refactor

### 1-1 call
- Caller uses `startCall()` in `CallContext`.
- `webrtcService.createOffer()` creates one `RTCPeerConnection`, sends `CALL_OFFER`.
- Callee receives `CALL_OFFER`, runs `handleOffer()`, then `createAnswer()`.
- Caller receives `CALL_ANSWER`, applies remote description.
- Both sides exchange `ICE_CANDIDATE` / `CALL_ICE_CANDIDATE`.

### Group call (old behavior)
- Caller marked `isGroup=true`, backend could broadcast offer.
- Frontend WebRTC only kept **one** `peerConnection`, **one** `remoteStream`.
- When multiple members joined, later peers could overwrite previous peer state.
- Result: unstable media, race condition in answer/ICE, difficult to add members mid-call.

## 2) Problems found

- `webrtcService` was single-peer design, not multi-peer.
- `CALL_ANSWER` / `ICE` routing lacked stable sender identity for multi-peer mapping.
- Group call startup relied on one logical flow but runtime needed per-peer connection.
- Adding members while call is active had no deterministic invite flow.

## 3) Refactored call architecture

## WebRTC service
- Changed from single `RTCPeerConnection` to `Map<peerId, RTCPeerConnection>`.
- Changed from single `remoteStream` to `Map<peerId, MediaStream>`.
- Added per-peer callId tracking and per-peer queued ICE tracking.
- Added sender metadata (`senderId`) into answer/ICE payload to route to correct peer.

## Call context
- Added group metadata into state:
  - `conversationId`
  - `isGroup`
  - `participantIds`
- Group call start now resolves conversation members and sends offers **per participant**.
- On accepting incoming group call:
  - send answer to caller
  - proactively create offers to other members to build mesh-like connections
- While active group call, on `MEMBERS_ADDED` for same conversation:
  - auto-invite new members by creating fresh offers to them

## 4) New practical call flow

### 1-1
- Unchanged logically, now still works through peer map with one entry.

### Group
- Initiator sends offer to each participant.
- Each participant answers initiator.
- Participant who accepts also offers to remaining members so everyone can connect.
- New users added to group during call get invited without ending current call.

## 5) Benefits

- Stable signaling for many peers (no overwritten connection object).
- Smoother media establishment because ICE/answer are mapped by sender.
- Better scalability for group evolution (late join after `MEMBERS_ADDED`).
- Backward-compatible event names remain (`CALL_*` and `ICE_CANDIDATE`).

## 6) Recommended next hardening

- Add explicit call session events:
  - `CALL_PARTICIPANT_JOINED`
  - `CALL_PARTICIPANT_LEFT`
  - `CALL_SYNC_PARTICIPANTS`
- Add UI grid for multi-remote streams (currently `CallWindow` displays primary stream).
- Add timeout/retry policy for unanswered peers in large groups.
- Add TURN server for NAT-restricted networks (currently STUN only).
