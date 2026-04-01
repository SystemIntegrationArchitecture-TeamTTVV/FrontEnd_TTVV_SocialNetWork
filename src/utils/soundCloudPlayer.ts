/** Official SoundCloud HTML5 widget — track page URL, not direct MP3. */
export function soundCloudWidgetSrc(trackPageUrl: string, visual: boolean): string {
  const page = trackPageUrl.split('?')[0];
  const q = new URLSearchParams({
    url: page,
    color: '#2563eb',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'true',
    show_reposts: 'false',
    show_teaser: 'true',
    visual: visual ? 'true' : 'false',
  });
  return `https://w.soundcloud.com/player/?${q.toString()}`;
}
