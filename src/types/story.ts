export type Story = {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  contentType: 'image' | 'text';
  content: string; // image url hoặc text
  background?: string; // dùng cho text story
};
