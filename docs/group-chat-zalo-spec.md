# Group Chat Spec - Zalo-like for SocialTTVV

## Mục tiêu
Tài liệu này mô tả đầy đủ bộ chức năng group chat theo phong cách Zalo, nhưng bám sát cấu trúc hiện tại của project SocialTTVV. Đây là tài liệu đặc tả sản phẩm, không phải code triển khai.

## Bối cảnh hiện tại của project
- Project đã có module messenger với conversation, message, group conversation, socket realtime, reaction, pin, star, reply, file upload, voice record, poll, forward, call.
- Project đã có AI assistant riêng ở mức app, nhưng chưa gắn vào luồng group chat.
- **Luồng nhóm chính:** [`Messenger.tsx`](../src/page/messenger/Messenger.tsx) khi `isGroup`, sidebar [`GroupChatSidebar`](../src/page/messenger/components/GroupChatSidebar.tsx). URL cũ `/messenger/group/:id` **redirect** về `/messenger?conversation=:id` (một màn hội thoại). File [`GroupChat.tsx`](../src/page/messenger/GroupChat.tsx) không còn là route entry (có thể gỡ sau khi chắc không tái sử dụng).
- Backend đã có API cho conversation, message và group management cơ bản.

## Phạm vi group chat kiểu Zalo
Group chat cần hỗ trợ các nhóm chức năng sau:
- Tạo nhóm và quản lý nhóm.
- Nhắn tin realtime trong nhóm.
- Media, file, emoji, reaction, pin, reply, forward.
- Phân quyền thành viên, admin, chủ nhóm.
- Thông báo, duyệt vào nhóm, rời nhóm, xóa thành viên.
- Tìm kiếm trong cuộc trò chuyện.
- Tính năng nâng cao kiểu Zalo như mention, ghim thông báo, mini poll, kho media, tin nhắn quan trọng.
- Tùy chọn AI hỗ trợ cho nhóm nếu muốn nâng cấp thành smart group chat.

## Các chức năng chính

### 1. Tạo nhóm
- Tạo nhóm từ danh sách bạn bè hoặc từ conversation hiện có.
- Đặt tên nhóm.
- Đặt avatar nhóm.
- Chọn thành viên ban đầu.
- Chọn chủ nhóm.
- Chọn admin ban đầu.
- Thiết lập chế độ duyệt thành viên.
- Giới hạn số thành viên tối đa nếu cần.

### 2. Quản lý thành viên
- Thêm thành viên.
- Xóa thành viên.
- Rời nhóm.
- Chuyển quyền chủ nhóm.
- Gán hoặc hạ quyền admin.
- Xem danh sách thành viên.
- Xem trạng thái online/offline nếu hệ thống có presence.
- Xem ai mới tham gia, ai vừa rời nhóm.

### 3. Nhắn tin trong nhóm
- Gửi text message.
- Gửi emoji và sticker.
- Gửi ảnh, video, file, audio.
- Reply message cụ thể.
- Forward message sang nhóm khác hoặc chat cá nhân.
- Edit message nếu cho phép.
- Delete message theo quyền.
- Đánh dấu tin nhắn quan trọng.
- Pin message lên đầu cuộc trò chuyện.
- Hiển thị trạng thái đã gửi, đã nhận, đã đọc.

### 4. Realtime
- Tin nhắn phải cập nhật realtime qua socket.
- Khi có người gửi tin, toàn bộ thành viên hợp lệ phải nhận event.
- Khi có join request, member update, role update, pin/unpin, reaction update cũng nên phát realtime.
- Mở nhóm trên nhiều thiết bị vẫn đồng bộ.

### 5. Tìm kiếm trong nhóm
- Tìm theo nội dung tin nhắn.
- Tìm theo người gửi.
- Tìm theo loại media.
- Tìm theo ngày.
- Tìm tin nhắn đã ghim hoặc đã đánh dấu.

### 6. Media và tài liệu
- Xem gallery ảnh/video trong nhóm.
- Xem danh sách file đã gửi.
- Lọc theo loại media.
- Download file.
- Preview ảnh, video, audio.

### 7. Thông báo nhóm
- Báo khi có tin nhắn mới.
- Báo khi có người nhắc tên.
- Báo khi có thành viên mới.
- Báo khi đổi tên nhóm, đổi avatar, đổi quyền.
- Báo khi có lời mời tham gia nhóm.

### 8. Duyệt tham gia nhóm
- Nhóm có thể bật hoặc tắt chế độ duyệt.
- Khi bật duyệt, thành viên mới phải chờ admin/chủ nhóm phê duyệt.
- Admin thấy danh sách join request.
- Admin có thể approve hoặc reject.

### 9. Quyền và phân cấp
- Chủ nhóm có quyền cao nhất.
- Admin có quyền quản trị thành viên và nội dung.
- Thành viên thường chỉ được chat và tương tác.
- Có thể cấu hình các quyền riêng như:
  - Chỉ admin được ghim tin nhắn.
  - Chỉ admin được đổi tên nhóm.
  - Chỉ admin được duyệt thành viên.
  - Chỉ admin được tạo poll.

### 10. Tương tác kiểu Zalo
- Ghim thông báo nhóm.
- Chia sẻ vị trí nếu ứng dụng hỗ trợ.
- Tạo poll bình chọn.
- Gửi voice note.
- Gửi sticker.
- React nhanh bằng emoji.
- Tag thành viên bằng @mention.

## Tính năng smart group chat
Nếu muốn nhóm chat thông minh kiểu Zalo nâng cấp, có thể thêm các module này:

### 1. AI tóm tắt nhóm
- Tóm tắt các tin nhắn mới trong nhóm.
- Tóm tắt theo ngày hoặc theo một khoảng thời gian.
- Chỉ ra quyết định quan trọng hoặc việc cần làm.
- Tóm tắt theo từng thành viên nếu cần.

### 2. AI gợi ý phản hồi
- Gợi ý trả lời ngắn.
- Gợi ý trả lời theo ngữ cảnh.
- Gợi ý lịch sự, thân mật hoặc công việc.

### 3. AI lọc và ưu tiên nội dung
- Phát hiện message chứa task, deadline, link, file quan trọng.
- Đánh dấu tự động tin nhắn có thông tin cần chú ý.
- Cảnh báo khi có nội dung spam hoặc trùng lặp.



## Luồng nghiệp vụ đề xuất

### Luồng 1: Tạo nhóm mới
1. Người dùng chọn tạo nhóm.
2. Chọn thành viên.
3. Nhập tên nhóm, avatar nhóm.
4. Thiết lập quyền, chế độ duyệt.
5. Tạo conversation group.
6. Phát event realtime cho các thành viên.

### Luồng 2: Gửi tin nhắn
1. Người dùng nhập nội dung.
2. Frontend validate content hoặc attachment.
3. Gọi API tạo message.
4. Backend lưu message.
5. Backend phát socket event cho các member.
6. UI update ngay lập tức.

### Luồng 3: Duyệt thành viên
1. User gửi join request.
2. Admin nhận thông báo.
3. Admin approve hoặc reject.
4. Nếu approve, member được thêm vào conversation.
5. Phát thông báo realtime.

### Luồng 4: AI tóm tắt nhóm
1. Người dùng mở tab AI summary.
2. Frontend gửi conversationId và khoảng thời gian.
3. Backend lấy message liên quan.
4. AI tạo summary.
5. Trả về bản tóm tắt dễ đọc.

## Data model đề xuất

### Conversation group
- `id`
- `isGroup`
- `groupName`
- `groupAvatar`
- `ownerId`
- `adminIds`
- `participantIds`
- `participantNames`
- `participantAvatars`
- `approvalsRequired`
- `pendingJoinIds`
- `lastMessagePreview`
- `lastMessageAt`

### Message
- `id`
- `conversationId`
- `senderId`
- `senderName`
- `senderAvatar`
- `content`
- `attachments`
- `replyToMessageId`
- `pinned`
- `starredByUserIds`
- `emojis`
- `isDeleted`
- `isEdited`
- `createdAt`

### Group permission
- `canSendMessage`
- `canAddMember`
- `canRemoveMember`
- `canChangeGroupInfo`
- `canPinMessage`
- `canCreatePoll`
- `canMentionEveryone`

## UI screens cần có
- Danh sách chat.
- Màn hình group chat.
- Group info / settings.
- Member list.
- Pending join requests.
- Shared media.
- Pinned messages.
- Search in conversation.
- AI assistant panel nếu bật smart mode.

## API cần có hoặc hoàn thiện
- `GET /api/message/conversations/user/{userId}`
- `GET /api/message/conversations/{id}`
- `POST /api/message/conversations/group`
- `POST /api/message/conversations/{id}/members`
- `DELETE /api/message/conversations/{id}/members`
- `PUT /api/message/conversations/{id}/roles`
- `PUT /api/message/conversations/{id}/meta`
- `POST /api/message/conversations/{id}/leave`
- `POST /api/message/conversations/{id}/join-requests`
- `GET /api/message/conversations/{id}/join-requests`
- `PUT /api/message/conversations/{id}/join-requests`
- `GET /api/message/messages/conversation/{conversationId}`
- `POST /api/message/messages`
- `POST /api/message/messages/{id}/pin`
- `POST /api/message/messages/{id}/star`
- `POST /api/message/messages/{id}/react`

## Socket events đề xuất
- `MESSAGE_RECEIVED`
- `MESSAGE_DELETED`
- `MESSAGE_EDITED`
- `GROUP_UPDATED`
- `GROUP_MEMBER_ADDED`
- `GROUP_MEMBER_REMOVED`
- `JOIN_REQUEST_CREATED`
- `JOIN_REQUEST_RESOLVED`
- `GROUP_ROLE_UPDATED`
- `MESSAGE_PINNED`
- `MESSAGE_REACTED`
- `AI_GROUP_SUMMARY_READY`

## Mức độ hoàn thiện hiện tại so với spec
### Đã có nền tảng
- Conversation và message API.
- Group conversation model cơ bản.
- Socket realtime.
- Reaction, pin, star, reply, file upload.
- AI assistant ở cấp ứng dụng.

### Chưa hoàn thiện / khác biệt so với Zalo đầy đủ
- Chưa có AI gắn riêng cho nhóm (field `aiAssistantEnabled` chưa có UX đầy đủ).
- Search trong cuộc: có API/search trong Messenger; có thể cần polish UX kiểu Zalo (highlight, jump message).
- Member management, pinned/media, mention, poll: đã có phần lớn trong Messenger/group sidebar — cần đối chiếu từng mục với checklist Zalo (invite link, duyệt vào nhóm, ghim thông báo nhóm, kho media tập trung, v.v.).

## Kết luận
Project hiện tại có nền tảng để làm group chat, nhưng chưa phải group chat kiểu Zalo hoàn chỉnh. Nếu triển khai theo tài liệu này, bạn có thể biến module messenger thành một group chat đầy đủ chức năng, và nếu muốn thì thêm luôn lớp AI để thành smart group chat.

## Gợi ý bước tiếp theo
- Viết task breakdown theo từng sprint.
- Chuyển tài liệu này thành checklist triển khai.
- Tách riêng phần UI, backend, socket, và AI.


You are designing a full-featured group chat system similar to Zalo using Java Spring Boot (backend) and React (frontend). The system must support complete group lifecycle management, real-time messaging, role-based permissions, media, and privacy features. The architecture must be scalable, secure, and production-ready.

The backend is built with Spring Boot using a layered architecture: Controller handles REST APIs and WebSocket endpoints, Service contains business logic, Repository uses Spring Data JPA or MongoDB, and Redis is used for caching and pub/sub. WebSocket (STOMP over SockJS or native WebSocket) is used for real-time communication.

Core domain entities include User, Group, GroupMember, Message, Conversation, and HiddenConversation.

User contains id, name, avatar, phoneNumber, and device/session metadata. A user can join multiple groups and have different roles in each group.

Group is the central entity and contains id, name, avatar, createdBy, createdAt, updatedAt, and metadata like description and settings. GroupMember is a join table containing userId, groupId, role (ADMIN, CO_ADMIN, MEMBER), nickname, joinedAt, mutedUntil, and isActive flag.

Message contains id, groupId, senderId, type (TEXT, IMAGE, VIDEO, FILE, SYSTEM), content, mediaUrl, seenBy (list of userIds), deletedFor (list of userIds), revoked (boolean), and timestamps.

HiddenConversation is used to implement Zalo-style hidden chats with fields: userId, groupId, isHidden, pinHash, and lastAccessAt.

GROUP CREATION FLOW:
A user sends a request to create a group with group name, optional avatar, and a list of initial members. The backend validates that all users exist, removes duplicates, and ensures the creator is included. A new Group entity is created, followed by multiple GroupMember entries where the creator is assigned ADMIN role and others are MEMBER. A system message like "User A created the group" is generated and stored. The system emits a real-time event to all invited users notifying them that they have been added to a group.

ADD MEMBER:
Only ADMIN or CO_ADMIN can add members. The system validates permissions, checks if the user is already in the group, and creates a new GroupMember record. A system message "User A added User B" is generated. A WebSocket event is emitted to the group.

REMOVE / KICK MEMBER:
Admins can remove members. The system marks the GroupMember as inactive or deletes it. If the removed user is currently connected via WebSocket, they are forced to leave the group room. A system message is generated.

LEAVE GROUP:
A member can leave voluntarily. If the user is the last ADMIN, the system must either:

1. Promote another member automatically, or
2. Prevent leaving until a new admin is assigned.
   If the group becomes empty, it can be soft-deleted.

CHANGE GROUP INFO:
Admins can update group name, avatar, and description. Updates are persisted and broadcast via WebSocket as "group_updated".

ROLE MANAGEMENT:
Admins can promote members to CO_ADMIN or demote them. Role changes are stored and broadcasted. Permissions are enforced at service layer.

GROUP SETTINGS:
Includes options such as:

* Only admins can send messages
* Only admins can add members
* Mute notifications for specific members
* Pin messages
  Settings are stored in Group entity or a separate GroupSettings table.

REAL-TIME COMMUNICATION:
Each group corresponds to a WebSocket topic or room (e.g., /topic/group/{groupId}). Users subscribe when they join the group. Events include:

* new_message
* group_updated
* member_added
* member_removed
* typing
* seen

MESSAGE FLOW:
User sends a message via REST or WebSocket. Backend validates membership, creates Message entity, and publishes it to the group topic. Other users receive it instantly. Seen status is updated when users read messages.

MEDIA HANDLING:
Files are uploaded via a REST endpoint to cloud storage (e.g., AWS S3). The backend returns a URL which is then used in message creation.

HIDDEN GROUP (ZALO STYLE):
Users can hide a group using a PIN. When hidden, the group is excluded from conversation list queries. The user can only rediscover the group via search. Upon accessing, the system prompts for PIN. The PIN is hashed using bcrypt and compared securely. If valid, the group is unhidden.

SEARCH GROUP:
Users can search groups by name. Hidden groups will appear in search results but require PIN to access.

CONVERSATION LIST:
API returns list of groups the user belongs to, sorted by last message timestamp. Hidden groups are excluded. Redis caching is used for performance.

PAGINATION:
Messages are loaded with cursor-based pagination (e.g., 20 messages per request). Older messages are fetched when scrolling up.

SECURITY:
All APIs require JWT authentication. Role-based access control is enforced. Sensitive actions like removing members or changing roles require admin privileges. PINs are hashed. Input validation is applied on all endpoints.

SCALABILITY:
WebSocket connections are scaled using Redis pub/sub. Multiple backend instances can broadcast messages consistently. Database indexing is applied on groupId, userId, and timestamps.

ERROR HANDLING:
All errors return structured JSON with error codes and messages. Logging is centralized using tools like ELK stack.

FRONTEND (REACT):
React application uses hooks and context or Redux for state management. WebSocket connection is established after login. Each group chat UI subscribes to its WebSocket topic. Features include:

* Create group modal
* Add/remove members UI
* Role management UI
* Chat window with infinite scroll
* Typing indicator
* Seen status
* Hidden chat unlock screen (PIN input)
* Media preview and upload

The UI must handle optimistic updates (show message immediately before server confirms) and rollback if needed.

This system fully replicates the group chat behavior of Zalo, including real-time messaging, group lifecycle management, role control, hidden conversations, and scalable architecture.
